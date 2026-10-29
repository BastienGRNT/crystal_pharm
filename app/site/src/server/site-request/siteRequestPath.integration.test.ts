import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/site test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);
process.env.SITE_URL ??= 'http://sites.localhost:3000';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
const database = postgres(databaseUrl, { max: 1 });

const subscribedTenantId = '00000000-0000-4000-8000-0000000000d1';
const unsubscribedTenantId = '00000000-0000-4000-8000-0000000000d2';
const probeTenantIds = [subscribedTenantId, unsubscribedTenantId];

const sitesHostname = new URL(process.env.SITE_URL).hostname;
const currentSubdomain = 'sonde-abonnee';
const formerSubdomain = 'sonde-ancienne';
const unsubscribedSubdomain = 'sonde-sans-droit';

function requestOn(subdomain: string, path = '/'): Request {
	return new Request(`http://${subdomain}.${sitesHostname}${path}`, { headers: { host: `${subdomain}.${sitesHostname}` } });
}

async function insertProbeTenant(tenantId: string, name: string, employeeFirstName: string): Promise<void> {
	await database`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number) values (${tenantId}, ${name}, '1 rue', '76000', 'Rouen', '0100000000')`;
	await database`insert into pharmacy.employees (id, tenant_id, first_name, last_name, job_title) values (gen_random_uuid(), ${tenantId}, ${employeeFirstName}, 'Sonde', 'Pharmacien')`;
	await database`insert into content.tenant_sites (tenant_id, layout_id) values (${tenantId}, 'essential')`;
}

async function removeProbeRows(): Promise<void> {
	await database`delete from content.site_subdomains where tenant_id in ${database(probeTenantIds)}`;
	await database`delete from content.tenant_sites where tenant_id in ${database(probeTenantIds)}`;
	await database`delete from pharmacy.tenants where id in ${database(probeTenantIds)}`;
}

beforeAll(async () => {
	await removeProbeRows();
	await insertProbeTenant(subscribedTenantId, 'Pharmacie Abonnée', 'Alice');
	await insertProbeTenant(unsubscribedTenantId, 'Pharmacie Sans Droit', 'Bob');
	await database`insert into content.site_subdomains (subdomain, tenant_id, is_current) values (${currentSubdomain}, ${subscribedTenantId}, true), (${formerSubdomain}, ${subscribedTenantId}, false), (${unsubscribedSubdomain}, ${unsubscribedTenantId}, true)`;
	await database`insert into billing.tenant_tool_access (tenant_id, tool_key, starts_at, paid_until, ends_at, granted_by)
		values (${subscribedTenantId}, 'site', now() - interval '1 day', now() + interval '30 days', now() + interval '31 days', 'probe')`;
});

afterAll(async () => {
	await database`delete from billing.tenant_tool_access where tenant_id in ${database(probeTenantIds)}`;
	await removeProbeRows();
	await database.end();
});

describe('ce que app/site décide depuis le seul Host', () => {
	it('répond 404 pour une adresse inconnue', async () => {
		const { prepareSiteRequest } = await import('./prepareSiteRequest.server');

		const prepared = await prepareSiteRequest(requestOn('sonde-introuvable'));

		expect(prepared.kind === 'respond' && prepared.response.status).toBe(404);
	});

	it('répond 503 quand le Tool site n’est pas actif', async () => {
		const { prepareSiteRequest } = await import('./prepareSiteRequest.server');

		const prepared = await prepareSiteRequest(requestOn(unsubscribedSubdomain));

		expect(prepared.kind === 'respond' && prepared.response.status).toBe(503);
	});

	it('redirige une ancienne adresse vers l’adresse actuelle, et un chemin « // » vers l’accueil', async () => {
		const { prepareSiteRequest } = await import('./prepareSiteRequest.server');

		const withPath = await prepareSiteRequest(requestOn(formerSubdomain, '/equipe'));
		const withDoubleSlash = await prepareSiteRequest(requestOn(formerSubdomain, '//evil.example'));

		expect(withPath.kind === 'respond' && withPath.response.status).toBe(301);
		expect(withPath.kind === 'respond' && withPath.response.headers.get('location')).toBe(`http://${currentSubdomain}.${sitesHostname}/equipe`);
		expect(withDoubleSlash.kind === 'respond' && withDoubleSlash.response.headers.get('location')).toBe(`http://${currentSubdomain}.${sitesHostname}/`);
	});

	it('donne le Tenant de l’adresse, sans tenir compte d’un en-tête x-tenant-id', async () => {
		const { prepareSiteRequest } = await import('./prepareSiteRequest.server');
		const request = new Request(`http://${currentSubdomain}.${sitesHostname}/`, {
			headers: { host: `${currentSubdomain}.${sitesHostname}`, 'x-tenant-id': unsubscribedTenantId }
		});

		const prepared = await prepareSiteRequest(request);

		expect(prepared.kind === 'render' && prepared.siteRequest?.tenantId).toBe(subscribedTenantId);
	});
});

describe('lectures du site en une instruction, sans fuite entre Tenants', () => {
	it('ne rend que la fiche, l’équipe et le contenu du Tenant demandé', async () => {
		const { readTenantSite } = await import('../tenant-site/readTenantSite.server');
		const { getPharmacyProfileInOneStatement, listEmployeesInOneStatement } = await import('@crystal-pharm/pharmacy-db');
		const { readTenantSiteContentInOneStatement } = await import('@crystal-pharm/content-db');

		const profile = await getPharmacyProfileInOneStatement(subscribedTenantId);
		const employees = await listEmployeesInOneStatement(subscribedTenantId);
		const content = await readTenantSiteContentInOneStatement(subscribedTenantId);
		const reading = await readTenantSite(subscribedTenantId);

		expect(profile?.name).toBe('Pharmacie Abonnée');
		expect(employees.map((employee) => employee.firstName.toStorageFormat())).toEqual(['Alice']);
		expect(content?.layoutId).toBe('essential');
		expect(reading.status === 'ready' || reading.status === 'invalid').toBe(true);
		expect(await listEmployeesInOneStatement('00000000-0000-4000-8000-0000000000ff')).toEqual([]);
	});
});

describe('page en cache puis modification de la fiche', () => {
	it('relit la page après la notification de Postgres', async () => {
		const { startListeningToSiteChanges, isSiteChangeListenerConnected } = await import('../cache/siteChangeListener.server');
		const { findCachedPage, readEvictionCount, storePageUnlessEvictedSince } = await import('../cache/sitePageCache.server');
		startListeningToSiteChanges();
		await waitUntil(isSiteChangeListenerConnected);
		const key = `${currentSubdomain}/`;
		storePageUnlessEvictedSince(readEvictionCount(), {
			key,
			page: { status: 200, headers: [['content-type', 'text/html']], body: 'Pharmacie Abonnée' },
			tenantId: subscribedTenantId,
			groupId: undefined,
			expiresAt: new Date(Date.now() + 60_000)
		});
		expect(findCachedPage(key)?.body).toBe('Pharmacie Abonnée');

		await database`update pharmacy.tenants set name = 'Pharmacie Renommée' where id = ${subscribedTenantId}`;
		await waitUntil(() => findCachedPage(key) === undefined);

		expect(findCachedPage(key)).toBeUndefined();
	});
});

async function waitUntil(condition: () => boolean): Promise<void> {
	const deadline = Date.now() + 3000;
	while (!condition()) {
		if (Date.now() > deadline) throw new Error('Condition jamais atteinte.');
		await new Promise((resolve) => setTimeout(resolve, 25));
	}
}
