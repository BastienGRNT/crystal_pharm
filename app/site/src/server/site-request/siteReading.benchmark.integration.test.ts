import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, it } from 'vitest';

// Mesure la lecture non cachée d'une page : aller-retour 1 (adresse + droit), puis 2 (contenu, fiche, équipe, groupement).
// Le rendu Solid n'y est pas : il se mesure à part, serveur lancé.
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');
const database = postgres(databaseUrl, { max: 1 });

const tenantId = '00000000-0000-4000-8000-0000000000e1';
const subdomain = 'sonde-mesure';
const measuredReadCount = 300;

beforeAll(async () => {
	await cleanUp();
	await database`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number) values (${tenantId}, 'Mesure', '1 rue', '76000', 'Rouen', '0100000000')`;
	await database`insert into content.tenant_sites (tenant_id, layout_id) values (${tenantId}, 'essential')`;
	await database`insert into content.site_subdomains (subdomain, tenant_id, is_current) values (${subdomain}, ${tenantId}, true)`;
	await database`insert into billing.tenant_tool_access (tenant_id, tool_key, starts_at, paid_until, ends_at, granted_by) values (${tenantId}, 'site', now(), now() + interval '30 days', now() + interval '31 days', 'probe')`;
});

async function cleanUp(): Promise<void> {
	await database`delete from billing.tenant_tool_access where tenant_id = ${tenantId}`;
	await database`delete from content.site_subdomains where tenant_id = ${tenantId}`;
	await database`delete from content.tenant_sites where tenant_id = ${tenantId}`;
	await database`delete from pharmacy.tenants where id = ${tenantId}`;
}

afterAll(async () => {
	await cleanUp();
	await database.end();
});

async function measureInMilliseconds(read: () => Promise<unknown>): Promise<{ median: number; p95: number }> {
	await read();
	const durations: number[] = [];
	for (let index = 0; index < measuredReadCount; index++) {
		const start = performance.now();
		await read();
		durations.push(performance.now() - start);
	}
	durations.sort((first, second) => first - second);
	return { median: durations[Math.floor(durations.length / 2)]!, p95: durations[Math.floor(durations.length * 0.95)]! };
}

it('mesure la lecture non cachée en deux allers-retours', async () => {
	const { readSiteAccessOfSubdomain } = await import('../site-access/readSiteAccessOfSubdomain.server');
	const { readTenantSite } = await import('../tenant-site/readTenantSite.server');

	const firstRoundTrip = await measureInMilliseconds(() => readSiteAccessOfSubdomain(subdomain));
	const secondRoundTrip = await measureInMilliseconds(() => readTenantSite(tenantId));
	const bothRoundTrips = await measureInMilliseconds(async () => {
		await readSiteAccessOfSubdomain(subdomain);
		await readTenantSite(tenantId);
	});

	process.stdout.write(`${JSON.stringify({ 'aller-retour 1': firstRoundTrip, 'aller-retour 2': secondRoundTrip, 'les deux': bothRoundTrips })}\n`);
}, 60_000);
