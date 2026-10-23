import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/billing-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

// Le compte de développement est superutilisateur et contourne la
// Row-Level Security : chaque test l'endosse sous un rôle ordinaire, créé
// puis effacé dans la même transaction, qui est toujours annulée.
const probeRoleName = 'billing_isolation_probe';
const firstGroup = {
	groupId: '00000000-0000-4000-9000-000000000001',
	tenantId: '00000000-0000-4000-9000-000000000011',
	accountId: 'groups-probe-first-account',
	invitedEmail: 'first-invited@example.test'
};
const secondGroup = {
	groupId: '00000000-0000-4000-9000-000000000002',
	tenantId: '00000000-0000-4000-9000-000000000012',
	accountId: 'groups-probe-second-account',
	invitedEmail: 'second-invited@example.test'
};

class RollbackAfterTest extends Error {}

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertTwoGroupsWithOnePharmacyEach(transaction);
			await insertContractsAndSubscriptions(transaction);
			await actAsOrdinaryRole(transaction);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function insertTwoGroupsWithOnePharmacyEach(transaction: postgres.TransactionSql): Promise<void> {
	for (const { groupId, tenantId, accountId, invitedEmail } of [firstGroup, secondGroup]) {
		await transaction`insert into auth.users (id, name, email) values (${accountId}, ${accountId}, ${`${accountId}@example.test`})`;
		await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
			values (${tenantId}, ${tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
		await transaction`insert into groups.pharmacy_groups (id, name, pharmacy_quota) values (${groupId}, ${groupId}, 10)`;
		await transaction`insert into groups.group_members (group_id, account_id) values (${groupId}, ${accountId})`;
		await transaction`insert into groups.pharmacy_memberships (id, tenant_id, group_id) values (gen_random_uuid(), ${tenantId}, ${groupId})`;
		await transaction`insert into groups.pharmacy_invitations (id, group_id, email, token_hash, expires_at)
			values (gen_random_uuid(), ${groupId}, ${invitedEmail}, ${`hash-${groupId}`}, now() + interval '1 day')`;
	}
}

async function insertContractsAndSubscriptions(transaction: postgres.TransactionSql): Promise<void> {
	for (const { groupId, tenantId } of [firstGroup, secondGroup]) {
		await transaction`insert into billing.group_contracts (group_id, payment_method, status) values (${groupId}, 'invoice', 'active')`;
		await transaction`insert into billing.group_tool_coverages (group_id, tool_key, discount_percent, group_share_percent)
			values (${groupId}, 'site', 0, 100)`;
		const [subscription] = await transaction`insert into billing.tenant_subscriptions (id, tenant_id)
			values (gen_random_uuid(), ${tenantId}) returning id`;
		await transaction`insert into billing.tenant_subscription_tools (tenant_id, subscription_id, tool_key)
			values (${tenantId}, ${subscription?.id}, 'planning')`;
	}
}

async function actAsOrdinaryRole(transaction: postgres.TransactionSql): Promise<void> {
	await transaction.unsafe(`create role ${probeRoleName} nologin`);
	for (const schemaName of ['pharmacy', 'groups', 'billing']) {
		await transaction.unsafe(`grant usage on schema ${schemaName} to ${probeRoleName}`);
		await transaction.unsafe(`grant select, insert, update, delete on all tables in schema ${schemaName} to ${probeRoleName}`);
	}
	await transaction.unsafe(`set local role ${probeRoleName}`);
}

async function setSetting(transaction: postgres.TransactionSql, settingName: string, settingValue: string): Promise<void> {
	await transaction`select set_config(${settingName}, ${settingValue}, true)`;
}

afterAll(async () => {
	await database.end();
});

describe('isolation des abonnements (Row-Level Security du schéma billing)', () => {
	it('ne montre à une pharmacie que son abonnement', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstGroup.tenantId);

			const subscriptions = await transaction`select tenant_id from billing.tenant_subscriptions`;

			expect(subscriptions.map(({ tenant_id }) => tenant_id)).toEqual([firstGroup.tenantId]);
		});
	});

	it('ne montre à une pharmacie que le contrat de son groupement', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstGroup.tenantId);

			const contracts = await transaction`select group_id from billing.group_contracts`;

			expect(contracts.map(({ group_id }) => group_id)).toEqual([firstGroup.groupId]);
		});
	});

	it('ne montre à un groupement que les modules de ses pharmacies, sans les modifier', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);

			const subscribedTools = await transaction`select tenant_id from billing.tenant_subscription_tools`;
			const updatedTools = await transaction`update billing.tenant_subscription_tools set ends_at = now()`;

			expect(subscribedTools.map(({ tenant_id }) => tenant_id)).toEqual([firstGroup.tenantId]);
			expect(updatedTools.count).toBe(0);
		});
	});

	it('ne laisse changer les prix et les contrats qu’à la Platform', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);

			const updatedCoverages = await transaction`update billing.group_tool_coverages set discount_percent = 100`;
			await expect(
				transaction`insert into billing.tool_prices (tool_key, monthly_price_cents) values ('site', 0)`
			).rejects.toThrow(/row-level security/);

			expect(updatedCoverages.count).toBe(0);
		});
	});

	it('ne laisse pas une pharmacie s’abonner au nom d’une autre', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstGroup.tenantId);

			await expect(
				transaction`insert into billing.tenant_subscriptions (id, tenant_id) values (gen_random_uuid(), ${secondGroup.tenantId})`
			).rejects.toThrow(/row-level security/);
		});
	});
});
