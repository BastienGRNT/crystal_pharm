import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/pharmacy-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

// Le compte de développement est superutilisateur et contourne la
// Row-Level Security : chaque test l'endosse sous un rôle ordinaire, créé
// puis effacé dans la même transaction, qui est toujours annulée.
const probeRoleName = 'pharmacy_isolation_probe';
const firstPharmacy = { tenantId: '00000000-0000-4000-8000-000000000001', accountId: 'isolation-probe-first-account' };
const secondPharmacy = { tenantId: '00000000-0000-4000-8000-000000000002', accountId: 'isolation-probe-second-account' };

class RollbackAfterTest extends Error {}

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertTwoPharmacies(transaction);
			await actAsOrdinaryRole(transaction);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function insertTwoPharmacies(transaction: postgres.TransactionSql): Promise<void> {
	for (const { tenantId, accountId } of [firstPharmacy, secondPharmacy]) {
		await transaction`insert into auth.users (id, name, email) values (${accountId}, ${accountId}, ${`${accountId}@example.test`})`;
		await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
			values (${tenantId}, ${tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
		await transaction`insert into pharmacy.tenant_memberships (tenant_id, account_id) values (${tenantId}, ${accountId})`;
	}
}

async function actAsOrdinaryRole(transaction: postgres.TransactionSql): Promise<void> {
	await transaction.unsafe(`create role ${probeRoleName} nologin`);
	await transaction.unsafe(`grant usage on schema pharmacy to ${probeRoleName}`);
	await transaction.unsafe(`grant select, insert, update, delete on all tables in schema pharmacy to ${probeRoleName}`);
	await transaction.unsafe(`set local role ${probeRoleName}`);
}

async function setActiveTenant(transaction: postgres.TransactionSql, tenantId: string): Promise<void> {
	await transaction`select set_config('app.tenant_id', ${tenantId}, true)`;
}

async function setActiveAccount(transaction: postgres.TransactionSql, accountId: string): Promise<void> {
	await transaction`select set_config('app.account_id', ${accountId}, true)`;
}

afterAll(async () => {
	await database.end();
});

describe('isolation entre pharmacies (Row-Level Security du schéma pharmacy)', () => {
	it('ne montre aucune pharmacie tant qu’aucun Tenant ni compte n’est posé', async () => {
		await inRolledBackTransaction(async (transaction) => {
			const visibleTenants = await transaction`select id from pharmacy.tenants`;

			expect(visibleTenants).toHaveLength(0);
		});
	});

	it('ne montre que la fiche du Tenant actif', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const visibleTenants = await transaction`select id from pharmacy.tenants`;

			expect(visibleTenants.map(({ id }) => id)).toEqual([firstPharmacy.tenantId]);
		});
	});

	it('ne modifie pas la fiche d’un autre Tenant', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			const updatedTenants = await transaction`update pharmacy.tenants set name = 'Piratée' where id = ${secondPharmacy.tenantId}`;

			expect(updatedTenants.count).toBe(0);
		});
	});

	it('refuse de créer une pharmacie pour un autre Tenant que l’actif', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstPharmacy.tenantId);

			await expect(
				transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
					values ('00000000-0000-4000-8000-000000000003', 'Autre', '1 rue', '75002', 'Paris', '0123456789')`
			).rejects.toThrow(/row-level security/);
		});
	});

	it('ne montre à un compte que ses propres pharmacies et appartenances', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveAccount(transaction, firstPharmacy.accountId);

			const visibleTenants = await transaction`select id from pharmacy.tenants`;
			const visibleMemberships = await transaction`select account_id from pharmacy.tenant_memberships`;

			expect(visibleTenants.map(({ id }) => id)).toEqual([firstPharmacy.tenantId]);
			expect(visibleMemberships.map(({ account_id }) => account_id)).toEqual([firstPharmacy.accountId]);
		});
	});

	it('ne laisse pas un compte se rattacher à une pharmacie qui n’est pas l’active', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveAccount(transaction, firstPharmacy.accountId);

			await expect(
				transaction`insert into pharmacy.tenant_memberships (tenant_id, account_id)
					values (${secondPharmacy.tenantId}, ${firstPharmacy.accountId})`
			).rejects.toThrow(/row-level security/);
		});
	});
});
