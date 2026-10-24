import { findCurrentSiteSubdomain } from '@crystal-pharm/content-db';
import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { changeSiteSubdomain } from './siteSubdomainRepository.server';

// Se lance avec `pnpm --filter @crystal-pharm/site-manager test:integration`,
// Postgres démarré et migré. Les lignes de test sont écrites pour de bon, puis effacées.
const repositoryEnvironmentFile = new URL('../../../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });

const firstTenantId = '00000000-0000-4000-8000-0000000000c1';
const secondTenantId = '00000000-0000-4000-8000-0000000000c2';
const testSubdomainPrefix = 'test-integration-change-';

async function deleteTestRows(): Promise<void> {
	await database`delete from content.site_subdomains where tenant_id in (${firstTenantId}, ${secondTenantId})`;
}

beforeEach(deleteTestRows);

afterAll(async () => {
	await deleteTestRows();
	await database.end();
});

describe('changeSiteSubdomain', () => {
	it('garde l’ancienne adresse au Tenant, qui peut y revenir', async () => {
		expect(await changeSiteSubdomain(firstTenantId, `${testSubdomainPrefix}port`)).toBe('changed');
		expect(await changeSiteSubdomain(firstTenantId, `${testSubdomainPrefix}quai`)).toBe('changed');
		expect(await changeSiteSubdomain(firstTenantId, `${testSubdomainPrefix}port`)).toBe('changed');

		expect(await findCurrentSiteSubdomain(firstTenantId)).toBe(`${testSubdomainPrefix}port`);
	});

	it('refuse une adresse qu’un autre site a eue, sans toucher à l’actuelle', async () => {
		await changeSiteSubdomain(firstTenantId, `${testSubdomainPrefix}port`);
		await changeSiteSubdomain(firstTenantId, `${testSubdomainPrefix}quai`);
		await changeSiteSubdomain(secondTenantId, `${testSubdomainPrefix}gare`);

		expect(await changeSiteSubdomain(secondTenantId, `${testSubdomainPrefix}port`)).toBe('taken');
		expect(await findCurrentSiteSubdomain(secondTenantId)).toBe(`${testSubdomainPrefix}gare`);
	});
});
