import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { siteChangeChannelName } from './siteChangeListener.server';

// Se lance avec `pnpm --filter @crystal-pharm/site test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });
const listener = postgres(databaseUrl, { max: 1 });

// Toute table que le site affiche, et seulement elles : en ajouter une au site sans
// son trigger laisserait des pages périmées dans le cache.
const tablesDisplayedBySite = [
	'billing.tenant_tool_access',
	'content.articles',
	'content.site_subdomains',
	'content.tenant_sites',
	'groups.group_articles',
	'groups.pharmacy_groups',
	'groups.pharmacy_memberships',
	'pharmacy.employees',
	'pharmacy.tenants'
];

const tenantId = '00000000-0000-4000-8000-0000000000a1';
const groupId = '00000000-0000-4000-8000-0000000000b1';
const membershipId = '00000000-0000-4000-8000-0000000000c1';

class RollbackAfterTest extends Error {}

const receivedPayloads: string[] = [];

async function waitForNotifications(): Promise<string[]> {
	await database`select 1`;
	await new Promise((resolve) => setTimeout(resolve, 150));
	return receivedPayloads.splice(0).sort();
}

async function insertTenantGroupAndMembership(transaction: postgres.TransactionSql): Promise<void> {
	await transaction`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number) values (${tenantId}, 'Sonde', '1 rue', '76000', 'Rouen', '0100000000')`;
	await transaction`insert into groups.pharmacy_groups (id, name, pharmacy_quota) values (${groupId}, 'Sonde', 1)`;
	await transaction`insert into groups.pharmacy_memberships (id, tenant_id, group_id) values (${membershipId}, ${tenantId}, ${groupId})`;
}

async function removeProbeRows(): Promise<void> {
	await database`delete from pharmacy.tenants where id = ${tenantId}`;
	await database`delete from groups.pharmacy_groups where id = ${groupId}`;
}

beforeAll(async () => {
	await removeProbeRows();
	await listener.listen(siteChangeChannelName, (payload) => {
		receivedPayloads.push(payload);
	});
	await waitForNotifications();
});

afterAll(async () => {
	await removeProbeRows();
	await listener.end();
	await database.end();
});

describe('notification des changements affichés par le site', () => {
	it('est posée sur chaque table affichée, pour l’insertion, la modification et la suppression', async () => {
		const triggers = await database<{ table_name: string; events: number }[]>`
			select tgrelid::regclass::text as table_name, tgtype & 28 as events
			from pg_trigger
			where tgfoid::regproc::text like '%notify_tenant_site_changed' and not tgisinternal
			order by 1`;

		const insertUpdateAndDelete = 4 + 8 + 16;
		expect(triggers.map((trigger) => trigger.table_name)).toEqual(tablesDisplayedBySite);
		expect(triggers.every((trigger) => trigger.events === insertUpdateAndDelete)).toBe(true);
	});

	it('n’envoie rien quand la transaction est annulée', async () => {
		await expect(
			database.begin(async (transaction) => {
				await insertTenantGroupAndMembership(transaction);
				throw new RollbackAfterTest();
			})
		).rejects.toBeInstanceOf(RollbackAfterTest);

		expect(await waitForNotifications()).toEqual([]);
	});

	it('n’envoie rien avant le COMMIT, puis le Tenant et le groupement après', async () => {
		await database.begin(async (transaction) => {
			await insertTenantGroupAndMembership(transaction);
			expect(receivedPayloads).toEqual([]);
		});

		const payloads = await waitForNotifications();
		expect(payloads).toEqual([`group:${groupId}`, `tenant:${tenantId}`]);
	});

	it('prévient le Tenant et le groupement quand une adhésion prend fin', async () => {
		await database`update groups.pharmacy_memberships set left_at = now() where id = ${membershipId}`;

		expect(await waitForNotifications()).toEqual([`group:${groupId}`, `tenant:${tenantId}`]);
	});

	it('prévient le Tenant quand sa fiche change', async () => {
		await database`update pharmacy.tenants set name = 'Sonde bis' where id = ${tenantId}`;

		expect(await waitForNotifications()).toEqual([`tenant:${tenantId}`]);
	});
});
