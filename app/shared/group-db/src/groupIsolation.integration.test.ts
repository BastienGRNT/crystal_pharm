import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/group-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

// Le compte de développement est superutilisateur et contourne la
// Row-Level Security : chaque test l'endosse sous un rôle ordinaire, créé
// puis effacé dans la même transaction, qui est toujours annulée.
const probeRoleName = 'groups_isolation_probe';
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

async function actAsOrdinaryRole(transaction: postgres.TransactionSql): Promise<void> {
	await transaction.unsafe(`create role ${probeRoleName} nologin`);
	for (const schemaName of ['pharmacy', 'groups']) {
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

describe('isolation entre groupements (Row-Level Security du schéma groups)', () => {
	it('ne montre rien tant qu’aucun groupement, Tenant ni compte n’est posé', async () => {
		await inRolledBackTransaction(async (transaction) => {
			expect(await transaction`select id from groups.pharmacy_groups`).toHaveLength(0);
			expect(await transaction`select id from groups.pharmacy_memberships`).toHaveLength(0);
			expect(await transaction`select id from groups.pharmacy_invitations`).toHaveLength(0);
		});
	});

	it('ne montre à un groupement que ses pharmacies et ses invitations', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);

			const memberships = await transaction`select tenant_id from groups.pharmacy_memberships`;
			const invitations = await transaction`select email from groups.pharmacy_invitations`;

			expect(memberships.map(({ tenant_id }) => tenant_id)).toEqual([firstGroup.tenantId]);
			expect(invitations.map(({ email }) => email)).toEqual([firstGroup.invitedEmail]);
		});
	});

	it('ne laisse pas un groupement inviter au nom d’un autre', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);

			await expect(
				transaction`insert into groups.pharmacy_invitations (id, group_id, email, token_hash, expires_at)
					values (gen_random_uuid(), ${secondGroup.groupId}, 'x@example.test', 'pirate', now() + interval '1 day')`
			).rejects.toThrow(/row-level security/);
		});
	});

	it('ne laisse pas un groupement retirer la pharmacie d’un autre', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);

			const updatedMemberships = await transaction`update groups.pharmacy_memberships set left_at = now()
				where tenant_id = ${secondGroup.tenantId}`;

			expect(updatedMemberships.count).toBe(0);
		});
	});

	it('ne montre à une pharmacie que son groupement', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstGroup.tenantId);

			const visibleGroups = await transaction`select id from groups.pharmacy_groups`;

			expect(visibleGroups.map(({ id }) => id)).toEqual([firstGroup.groupId]);
		});
	});

	it('ne montre une invitation qu’à son email ou à son jeton', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.account_email', secondGroup.invitedEmail);
			const invitationsByEmail = await transaction`select group_id from groups.pharmacy_invitations`;
			expect(invitationsByEmail.map(({ group_id }) => group_id)).toEqual([secondGroup.groupId]);
		});
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.invitation_token_hash', `hash-${firstGroup.groupId}`);
			const invitationsByToken = await transaction`select group_id from groups.pharmacy_invitations`;
			expect(invitationsByToken.map(({ group_id }) => group_id)).toEqual([firstGroup.groupId]);
		});
	});

	it('ne laisse lire à un groupement que les fiches qu’il désigne, sans les modifier', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.readable_tenant_ids', firstGroup.tenantId);

			const visibleTenants = await transaction`select id from pharmacy.tenants`;
			const updatedTenants = await transaction`update pharmacy.tenants set name = 'Piratée' where id = ${firstGroup.tenantId}`;

			expect(visibleTenants.map(({ id }) => id)).toEqual([firstGroup.tenantId]);
			expect(updatedTenants.count).toBe(0);
		});
	});

	it('laisse un groupement modifier sa fiche, jamais celle d’un autre ni la supprimer', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);

			const updatedOwnGroups = await transaction`update groups.pharmacy_groups set name = 'Renommé' where id = ${firstGroup.groupId}`;
			const updatedOtherGroups = await transaction`update groups.pharmacy_groups set name = 'Piraté' where id = ${secondGroup.groupId}`;
			const deletedGroups = await transaction`delete from groups.pharmacy_groups`;

			expect(updatedOwnGroups.count).toBe(1);
			expect(updatedOtherGroups.count).toBe(0);
			expect(deletedGroups.count).toBe(0);
		});
	});

	it('ne laisse pas une pharmacie modifier la fiche de son groupement', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.tenant_id', firstGroup.tenantId);

			const updatedGroups = await transaction`update groups.pharmacy_groups set name = 'Piraté' where id = ${firstGroup.groupId}`;

			expect(updatedGroups.count).toBe(0);
		});
	});

	it('ne laisse créer un groupement qu’à la Platform', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setSetting(transaction, 'app.group_id', firstGroup.groupId);
			await expect(
				transaction`insert into groups.pharmacy_groups (id, name, pharmacy_quota) values (gen_random_uuid(), 'Pirate', 10)`
			).rejects.toThrow(/row-level security/);
		});
	});
});
