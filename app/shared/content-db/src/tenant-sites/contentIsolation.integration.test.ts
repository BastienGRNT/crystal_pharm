import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/content-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

// Le compte de développement est superutilisateur et contourne la
// Row-Level Security : chaque test l'endosse sous un rôle ordinaire, créé
// puis effacé dans la même transaction, qui est toujours annulée.
const probeRoleName = 'content_isolation_probe';
const firstTenantId = '00000000-0000-4000-8000-000000000001';
const secondTenantId = '00000000-0000-4000-8000-000000000002';

function articleIdOf(tenantId: string): string {
	return tenantId.replace('00000000-0000-4000', '33333333-3333-4333');
}

class RollbackAfterTest extends Error {}

async function inRolledBackTransaction(test: (transaction: postgres.TransactionSql) => Promise<void>): Promise<void> {
	try {
		await database.begin(async (transaction) => {
			await insertTwoSites(transaction);
			await actAsOrdinaryRole(transaction);
			await test(transaction);
			throw new RollbackAfterTest();
		});
	} catch (error) {
		if (!(error instanceof RollbackAfterTest)) throw error;
	}
}

async function insertTwoSites(transaction: postgres.TransactionSql): Promise<void> {
	for (const tenantId of [firstTenantId, secondTenantId]) {
		await transaction`insert into content.tenant_sites (tenant_id, layout_id) values (${tenantId}, 'essential')`;
		await transaction`insert into content.articles (id, tenant_id, title, summary, published_at)
			values (${articleIdOf(tenantId)}, ${tenantId}, 'Vaccination', 'Sans rendez-vous', now())`;
	}
}

async function actAsOrdinaryRole(transaction: postgres.TransactionSql): Promise<void> {
	await transaction.unsafe(`create role ${probeRoleName} nologin`);
	await transaction.unsafe(`grant usage on schema content to ${probeRoleName}`);
	await transaction.unsafe(`grant select, insert, update, delete on all tables in schema content to ${probeRoleName}`);
	await transaction.unsafe(`set local role ${probeRoleName}`);
}

async function setActiveTenant(transaction: postgres.TransactionSql, tenantId: string): Promise<void> {
	await transaction`select set_config('app.tenant_id', ${tenantId}, true)`;
}

afterAll(async () => {
	await database.end();
});

describe('isolation entre sites (Row-Level Security du schéma content)', () => {
	it('ne montre aucun site ni article tant qu’aucun Tenant n’est posé', async () => {
		await inRolledBackTransaction(async (transaction) => {
			const visibleSites = await transaction`select tenant_id from content.tenant_sites`;
			const visibleArticles = await transaction`select id from content.articles`;

			expect(visibleSites).toHaveLength(0);
			expect(visibleArticles).toHaveLength(0);
		});
	});

	it('ne montre que le site et les articles du Tenant actif', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstTenantId);

			const visibleSites = await transaction`select tenant_id from content.tenant_sites`;
			const visibleArticles = await transaction`select id from content.articles`;

			expect(visibleSites.map(({ tenant_id }) => tenant_id)).toEqual([firstTenantId]);
			expect(visibleArticles.map(({ id }) => id)).toEqual([articleIdOf(firstTenantId)]);
		});
	});

	it('ne modifie ni ne retire le contenu d’un autre Tenant', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstTenantId);

			const updatedSites = await transaction`update content.tenant_sites set layout_id = 'atelier' where tenant_id = ${secondTenantId}`;
			const deletedArticles = await transaction`delete from content.articles where tenant_id = ${secondTenantId}`;

			expect(updatedSites.count).toBe(0);
			expect(deletedArticles.count).toBe(0);
		});
	});

	it('ne change pas la source des actualités d’un autre Tenant', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstTenantId);

			const updatedOwnSites = await transaction`update content.tenant_sites set news_source = 'group' where tenant_id = ${firstTenantId}`;
			const updatedOtherSites = await transaction`update content.tenant_sites set news_source = 'group' where tenant_id = ${secondTenantId}`;

			expect(updatedOwnSites.count).toBe(1);
			expect(updatedOtherSites.count).toBe(0);
		});
	});

	it('refuse d’écrire un article pour un autre Tenant que l’actif', async () => {
		await inRolledBackTransaction(async (transaction) => {
			await setActiveTenant(transaction, firstTenantId);

			await expect(
				transaction`insert into content.articles (id, tenant_id, title, summary, published_at)
					values ('44444444-4444-4444-8444-444444444444', ${secondTenantId}, 'Promo', '-10 %', now())`
			).rejects.toThrow(/row-level security/);
		});
	});
});
