import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { respondToSiteAccessRequest } from './siteAccessRequest.server';

// Se lance avec `pnpm --filter @crystal-pharm/site-manager test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`). Le handler ouvre
// ses propres connexions : les lignes de test sont écrites pour de bon, puis effacées.
const repositoryEnvironmentFile = new URL('../../../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
const gatewayToken: string = process.env.SITE_GATEWAY_TOKEN ?? '';
if (!gatewayToken) throw new Error('SITE_GATEWAY_TOKEN is missing from the environment.');
const sitesHost = new URL(process.env.SITE_URL ?? '').host;

const database = postgres(databaseUrl, { max: 1 });

const subscribedTenantId = '00000000-0000-4000-8000-0000000000b1';
const unsubscribedTenantId = '00000000-0000-4000-8000-0000000000b2';
const testSubdomainPrefix = 'test-integration-access-';

async function insertTenantWithSubdomains(tenantId: string, currentSubdomain: string, formerSubdomains: string[] = []): Promise<void> {
	await database`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
		values (${tenantId}, ${tenantId}, '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
	await database`insert into content.site_subdomains (subdomain, tenant_id, is_current) values (${currentSubdomain}, ${tenantId}, true)`;
	for (const formerSubdomain of formerSubdomains) {
		await database`insert into content.site_subdomains (subdomain, tenant_id, is_current) values (${formerSubdomain}, ${tenantId}, false)`;
	}
}

async function subscribeToSite(tenantId: string): Promise<void> {
	const [subscription] = await database`insert into billing.tenant_subscriptions (id, tenant_id) values (gen_random_uuid(), ${tenantId}) returning id`;
	await database`insert into billing.tenant_subscription_tools (tenant_id, subscription_id, tool_key) values (${tenantId}, ${subscription?.id}, 'site')`;
}

// Les lignes de `billing` partent avec le Tenant (clé étrangère en cascade).
async function deleteTestRows(): Promise<void> {
	await database`delete from content.site_subdomains where subdomain like ${`${testSubdomainPrefix}%`}`;
	await database`delete from pharmacy.tenants where id in (${subscribedTenantId}, ${unsubscribedTenantId})`;
}

function askSiteAccess(subdomain: string, { token = gatewayToken, uri = '/' }: { token?: string; uri?: string } = {}): Promise<Response> {
	return respondToSiteAccessRequest(
		new Request('http://localhost:5173/internal/site-access', {
			headers: { 'x-site-gateway-token': token, 'x-forwarded-host': `${subdomain}.${sitesHost}`, 'x-forwarded-uri': uri, 'x-forwarded-proto': 'http' }
		})
	);
}

beforeAll(async () => {
	await deleteTestRows();
	await insertTenantWithSubdomains(subscribedTenantId, `${testSubdomainPrefix}port`, [`${testSubdomainPrefix}ancien-port`]);
	await subscribeToSite(subscribedTenantId);
	await insertTenantWithSubdomains(unsubscribedTenantId, `${testSubdomainPrefix}gare`);
});

afterAll(async () => {
	await deleteTestRows();
	await database.end();
});

describe('respondToSiteAccessRequest', () => {
	it('donne le Tenant et la version du site à servir pour une adresse d’un Tenant abonné', async () => {
		const response = await askSiteAccess(`${testSubdomainPrefix}port`);

		expect(response.status).toBe(200);
		expect(response.headers.get('x-tenant-id')).toBe(subscribedTenantId);
		expect(response.headers.get('x-site-version')).toMatch(/^[\w-]{22}$/);
		expect(response.headers.get('cache-control')).toBe('no-store');
	});

	it('change la version du site quand la fiche de la pharmacie change, même sans enregistrer le site', async () => {
		const versionBefore = (await askSiteAccess(`${testSubdomainPrefix}port`)).headers.get('x-site-version');
		await database`update pharmacy.tenants set phone_number = '0987654321' where id = ${subscribedTenantId}`;
		const versionAfter = (await askSiteAccess(`${testSubdomainPrefix}port`)).headers.get('x-site-version');

		expect(versionAfter).not.toBe(versionBefore);
		expect((await askSiteAccess(`${testSubdomainPrefix}port`)).headers.get('x-site-version')).toBe(versionAfter);
	});

	it('refuse le site d’un Tenant sans abonnement', async () => {
		const response = await askSiteAccess(`${testSubdomainPrefix}gare`);

		expect(response.status).toBe(402);
		expect(response.headers.get('x-tenant-id')).toBeNull();
	});

	it('renvoie une ancienne adresse vers l’actuelle, même page', async () => {
		const response = await askSiteAccess(`${testSubdomainPrefix}ancien-port`, { uri: '/services?onglet=2' });

		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe(`http://${testSubdomainPrefix}port.${sitesHost}/services?onglet=2`);
	});

	it('ne renvoie jamais vers un autre domaine', async () => {
		const response = await askSiteAccess(`${testSubdomainPrefix}ancien-port`, { uri: '//exemple.fr/piege' });

		expect(response.headers.get('location')).toBe(`http://${testSubdomainPrefix}port.${sitesHost}/`);
	});

	it('ne connaît pas une adresse qu’aucun site n’a eue', async () => {
		expect((await askSiteAccess(`${testSubdomainPrefix}inconnue`)).status).toBe(404);
	});

	it('ne répond qu’à la passerelle', async () => {
		const response = await askSiteAccess(`${testSubdomainPrefix}port`, { token: 'faux-jeton' });

		expect(response.status).toBe(401);
		expect(response.headers.get('x-tenant-id')).toBeNull();
	});
});
