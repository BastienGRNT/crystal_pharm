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

const probeRoleName = 'offers_isolation_probe';
const firstTenantId = '00000000-0000-4000-9000-0000000000a1';
const secondTenantId = '00000000-0000-4000-9000-0000000000a2';
const firstGroupId = '00000000-0000-4000-9000-0000000000b1';
const secondGroupId = '00000000-0000-4000-9000-0000000000b2';
const offerKey = 'isolation-probe-offer';

class RollbackAfterTest extends Error {}

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertFixtures(transaction);
			await actAsOrdinaryRole(transaction);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function insertFixtures(transaction: postgres.TransactionSql): Promise<void> {
	await transaction`insert into billing.offers (offer_key, label) values (${offerKey}, 'Offre de test')`;
	const [version] = await transaction`insert into billing.offer_versions (id, offer_key, version_number, monthly_price_cents)
		values (gen_random_uuid(), ${offerKey}, 1, 2900) returning id`;
	for (const [tenantId, groupId] of [[firstTenantId, firstGroupId], [secondTenantId, secondGroupId]] as const) {
		await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
			values (${tenantId}, ${tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
		await transaction`insert into groups.pharmacy_groups (id, name, pharmacy_quota) values (${groupId}, ${groupId}, 10)`;
		const [subscription] = await transaction`insert into billing.tenant_subscriptions (id, tenant_id)
			values (gen_random_uuid(), ${tenantId}) returning id`;
		await transaction`insert into billing.tenant_subscription_items (id, tenant_id, subscription_id, offer_version_id, billed_monthly_price_cents)
			values (gen_random_uuid(), ${tenantId}, ${subscription?.id}, ${version?.id}, 2900)`;
		await transaction`insert into billing.tenant_tool_access (tenant_id, tool_key, starts_at, paid_until, ends_at, granted_by)
			values (${tenantId}, 'planning', now(), now() + interval '1 month', now() + interval '1 month', 'subscription')`;
		await transaction`insert into billing.price_agreements (id, tenant_id, offer_key, monthly_price_cents)
			values (gen_random_uuid(), ${tenantId}, ${offerKey}, 1900)`;
		await transaction`insert into billing.group_contract_versions (id, group_id, version_number, payment_method, billing_mode, coverages)
			values (gen_random_uuid(), ${groupId}, 1, 'invoice', 'usage', '[]')`;
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

describe('isolation des offres, accords et accès (Row-Level Security du schéma billing)', () => {
	it('ne montre à une pharmacie que ses propres accès', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstTenantId);
			const accessLines = await transaction`select tenant_id from billing.tenant_tool_access`;
			expect(accessLines.map(({ tenant_id }) => tenant_id)).toEqual([firstTenantId]);
		});
	});

	it('ne laisse pas une pharmacie écrire les accès d’une autre', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstTenantId);
			await expect(
				transaction`insert into billing.tenant_tool_access (tenant_id, tool_key, starts_at, paid_until, ends_at, granted_by)
					values (${secondTenantId}, 'site', now(), now(), now() + interval '1 day', 'subscription')`
			).rejects.toThrow(/row-level security/);
		});
	});

	it('ne montre à une pharmacie que les lignes de son abonnement', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstTenantId);
			const items = await transaction`select tenant_id from billing.tenant_subscription_items`;
			expect(items.map(({ tenant_id }) => tenant_id)).toEqual([firstTenantId]);
		});
	});

	it('ne montre à une pharmacie que ses prix négociés, sans pouvoir en accorder', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstTenantId);
			const agreements = await transaction`select tenant_id from billing.price_agreements`;
			expect(agreements.map(({ tenant_id }) => tenant_id)).toEqual([firstTenantId]);
			await expect(
				transaction`insert into billing.price_agreements (id, tenant_id, offer_key, monthly_price_cents)
					values (gen_random_uuid(), ${firstTenantId}, ${offerKey}, 0)`
			).rejects.toThrow(/row-level security/);
		});
	});

	it('ne montre à un groupement que ses propres prix négociés et versions de contrat', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroupId);
			const contractVersions = await transaction`select group_id from billing.group_contract_versions`;
			expect(contractVersions.map(({ group_id }) => group_id)).toEqual([firstGroupId]);
			const updatedVersions = await transaction`update billing.group_contract_versions set ends_at = now()`;
			expect(updatedVersions.count).toBe(0);
		});
	});

	it('ne laisse publier une version d’offre qu’à la Platform', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstTenantId);
			await expect(
				transaction`insert into billing.offer_versions (id, offer_key, version_number, monthly_price_cents)
					values (gen_random_uuid(), ${offerKey}, 2, 100)`
			).rejects.toThrow(/row-level security/);
		});
	});

	it('ne laisse jamais modifier une version d’offre', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstTenantId);
			const updatedVersions = await transaction`update billing.offer_versions set monthly_price_cents = 0`;
			expect(updatedVersions.count).toBe(0);
		});
	});
});
