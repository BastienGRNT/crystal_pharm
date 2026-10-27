import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/billing-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const { readToolAccessLines } = await import('./toolAccessReading.server');

const database = postgres(databaseUrl, { max: 1 });
const tenantId = '00000000-0000-4000-9000-0000000000d1';
const readCount = 500;
const medianBudgetInMilliseconds = 2;

beforeAll(async () => {
	await database`delete from pharmacy.tenants where id = ${tenantId}`;
	await database`insert into pharmacy.tenants (id, name, street, postal_code, city, phone_number)
		values (${tenantId}, 'Pharmacie du banc d’essai', '1 rue de la Paix', '75002', 'Paris', '0123456789')`;
	for (const toolKey of ['site', 'planning', 'booking', 'prescriptions']) {
		await database`insert into billing.tenant_tool_access (tenant_id, tool_key, starts_at, paid_until, ends_at, granted_by)
			values (${tenantId}, ${toolKey}, now() - interval '1 month', now() + interval '1 month', now() + interval '1 month', 'subscription')`;
	}
});

afterAll(async () => {
	await database`delete from pharmacy.tenants where id = ${tenantId}`;
	await database.end();
});

describe('la lecture des droits d’une pharmacie', () => {
	it('tient en moins de 2 ms (médiane) en une seule instruction', async () => {
		await readToolAccessLines(tenantId);
		const durationsInMilliseconds: number[] = [];
		for (let readIndex = 0; readIndex < readCount; readIndex += 1) {
			const startedAt = performance.now();
			await readToolAccessLines(tenantId);
			durationsInMilliseconds.push(performance.now() - startedAt);
		}
		durationsInMilliseconds.sort((first, second) => first - second);
		const median = durationsInMilliseconds[Math.floor(readCount / 2)] ?? Infinity;
		const ninetyFifthPercentile = durationsInMilliseconds[Math.floor(readCount * 0.95)] ?? Infinity;
		console.info(`Lecture des droits : médiane ${median.toFixed(2)} ms, p95 ${ninetyFifthPercentile.toFixed(2)} ms sur ${readCount} lectures.`);

		expect(median).toBeLessThan(medianBudgetInMilliseconds);
	});
});
