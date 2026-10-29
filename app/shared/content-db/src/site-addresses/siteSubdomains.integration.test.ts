import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/content-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

const probeRoleName = 'site_subdomains_probe';
const firstTenantId = '00000000-0000-4000-8000-0000000000a1';
const secondTenantId = '00000000-0000-4000-8000-0000000000a2';
const testSubdomainPrefix = 'test-integration-';

async function insertSubdomain(transaction: postgres.Sql | postgres.TransactionSql, subdomain: string, tenantId: string, isCurrent: boolean) {
	await transaction`insert into content.site_subdomains (subdomain, tenant_id, is_current) values (${subdomain}, ${tenantId}, ${isCurrent})`;
}

async function deleteTestRows(): Promise<void> {
	await database`delete from content.site_subdomains where subdomain like ${`${testSubdomainPrefix}%`}`;
}

class RollbackAfterTest extends Error {}

// Le compte de développement est superutilisateur et contourne la Row-Level
// Security : ces tests l'endossent sous un rôle ordinaire, dans une transaction annulée.
async function asOrdinaryRole(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertSubdomain(transaction, `${testSubdomainPrefix}port`, firstTenantId, true);
			await insertSubdomain(transaction, `${testSubdomainPrefix}gare`, secondTenantId, true);
			await transaction.unsafe(`create role ${probeRoleName} nologin`);
			await transaction.unsafe(`grant usage on schema content to ${probeRoleName}`);
			await transaction.unsafe(`grant select, insert, update, delete on all tables in schema content to ${probeRoleName}`);
			await transaction.unsafe(`set local role ${probeRoleName}`);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

beforeAll(deleteTestRows);

afterAll(async () => {
	await deleteTestRows();
	await database.end();
});

describe('adresses des sites (Row-Level Security)', () => {
	it('ne montre aucune adresse sans Tenant ni adresse demandée', async () => {
		await asOrdinaryRole(async (transaction) => {
			expect(await transaction`select subdomain from content.site_subdomains`).toHaveLength(0);
		});
	});

	it('ne montre à la lecture d’une adresse que l’adresse demandée', async () => {
		await asOrdinaryRole(async (transaction) => {
			await transaction`select set_config('app.requested_subdomain', ${`${testSubdomainPrefix}port`}, true)`;

			const visibleRows = await transaction`select subdomain, tenant_id from content.site_subdomains`;

			expect(visibleRows).toEqual([{ subdomain: `${testSubdomainPrefix}port`, tenant_id: firstTenantId }]);
		});
	});

	it('refuse qu’un Tenant prenne l’adresse d’un autre', async () => {
		await asOrdinaryRole(async (transaction) => {
			await transaction`select set_config('app.tenant_id', ${firstTenantId}, true)`;

			await expect(insertSubdomain(transaction, `${testSubdomainPrefix}gare`, firstTenantId, false)).rejects.toThrow(/duplicate key/);
		});
	});
});
