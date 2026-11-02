import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { deleteSiteTrafficOfTenant, readSiteTraffic, recordPageViews } from './pageViews.server';

// Se lance avec `pnpm --filter @crystal-pharm/site-traffic-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

const firstTenantId = '00000000-0000-4000-8000-0000000000d1';
const secondTenantId = '00000000-0000-4000-8000-0000000000d2';
const now = new Date('2026-11-01T15:30:00Z');

async function deleteTestRows(): Promise<void> {
	await deleteSiteTrafficOfTenant(firstTenantId);
	await deleteSiteTrafficOfTenant(secondTenantId);
}

beforeEach(deleteTestRows);

afterAll(async () => {
	await deleteTestRows();
	await database.end();
});

describe('recordPageViews', () => {
	it('ajoute les vues d’une même heure et d’une même page', async () => {
		const hourStart = new Date('2026-11-01T09:00:00Z');
		await recordPageViews([{ tenantId: firstTenantId, hourStart, pagePath: '/', viewCount: 3, visitCount: 2 }]);
		await recordPageViews([{ tenantId: firstTenantId, hourStart, pagePath: '/', viewCount: 4, visitCount: 1 }]);

		const reading = await readSiteTraffic(firstTenantId, now);

		expect(reading.dailyTraffic).toEqual([{ day: '2026-11-01', viewCount: 7, visitCount: 3 }]);
		expect(reading.mostViewedPages).toEqual([{ pagePath: '/', viewCount: 7 }]);
	});

	it('range une vue dans le jour et l’heure de la pharmacie', async () => {
		// 23 h 30 à Paris le samedi 31 octobre (heure d'hiver : UTC+1).
		await recordPageViews([{ tenantId: firstTenantId, hourStart: new Date('2026-10-31T22:00:00Z'), pagePath: '/', viewCount: 1, visitCount: 1 }]);

		const reading = await readSiteTraffic(firstTenantId, now);

		expect(reading.dailyTraffic).toEqual([{ day: '2026-10-31', viewCount: 1, visitCount: 1 }]);
		expect(reading.hourlyBusyness).toEqual([{ weekday: 5, hour: 23, visitCount: 1 }]);
	});

	it('ne lit que la période montrée', async () => {
		await recordPageViews([{ tenantId: firstTenantId, hourStart: new Date('2026-09-01T09:00:00Z'), pagePath: '/', viewCount: 5, visitCount: 5 }]);

		expect((await readSiteTraffic(firstTenantId, now)).dailyTraffic).toEqual([]);
	});

	it('ne lit que les vues du Tenant demandé', async () => {
		const hourStart = new Date('2026-11-01T09:00:00Z');
		await recordPageViews([
			{ tenantId: firstTenantId, hourStart, pagePath: '/', viewCount: 2, visitCount: 2 },
			{ tenantId: secondTenantId, hourStart, pagePath: '/services', viewCount: 8, visitCount: 8 }
		]);

		expect((await readSiteTraffic(firstTenantId, now)).mostViewedPages).toEqual([{ pagePath: '/', viewCount: 2 }]);
		expect((await readSiteTraffic(secondTenantId, now)).mostViewedPages).toEqual([{ pagePath: '/services', viewCount: 8 }]);
	});
});

// Le compte de développement est superutilisateur et contourne la Row-Level
// Security : le test l'endosse sous un rôle ordinaire, dans une transaction annulée.
class RollbackAfterTest extends Error {}

describe('Row-Level Security', () => {
	it('ne montre et n’écrit que les vues du Tenant actif', async () => {
		const probeRoleName = 'site_traffic_isolation_probe';
		try {
			await database.begin(async (transaction) => {
				for (const tenantId of [firstTenantId, secondTenantId]) {
					await transaction`insert into site_traffic.hourly_page_views values (${tenantId}, now(), '/', 1, 1)`;
				}
				await transaction.unsafe(`create role ${probeRoleName} nologin`);
				await transaction.unsafe(`grant usage on schema site_traffic to ${probeRoleName}`);
				await transaction.unsafe(`grant select, insert, update, delete on all tables in schema site_traffic to ${probeRoleName}`);
				await transaction.unsafe(`set local role ${probeRoleName}`);
				await transaction`select set_config('app.tenant_id', ${firstTenantId}, true)`;

				const visibleRows = await transaction`select tenant_id from site_traffic.hourly_page_views where tenant_id in (${firstTenantId}, ${secondTenantId})`;
				expect(visibleRows.map((row) => row.tenant_id)).toEqual([firstTenantId]);
				await expect(
					transaction`insert into site_traffic.hourly_page_views values (${secondTenantId}, now() + interval '1 hour', '/', 1, 1)`
				).rejects.toThrow(/row-level security/);
				throw new RollbackAfterTest();
			});
		} catch (error) {
			if (!(error instanceof RollbackAfterTest)) throw error;
		}
	});
});
