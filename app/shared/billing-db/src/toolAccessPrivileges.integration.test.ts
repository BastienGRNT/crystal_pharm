import { existsSync } from 'node:fs';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

// Se lance avec `pnpm --filter @crystal-pharm/billing-db test:integration`,
// Postgres démarré (`make start`) et migré (`make migrate`).
const repositoryEnvironmentFile = new URL('../../../../.env', import.meta.url);
if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is missing from the environment.');

const database = postgres(databaseUrl, { max: 1 });
const writePrivileges = ['INSERT', 'UPDATE', 'DELETE', 'TRUNCATE'];

afterAll(async () => {
	await database.end();
});

describe('droits Postgres sur billing.tenant_tool_access', () => {
	it('seul le propriétaire de la table peut y écrire', async () => {
		const writers = await database`
			select distinct grantee from information_schema.role_table_grants
			where table_schema = 'billing' and table_name = 'tenant_tool_access'
				and privilege_type = any(${writePrivileges})
				and grantee <> (select tableowner from pg_tables where schemaname = 'billing' and tablename = 'tenant_tool_access')`;
		expect(writers.map(({ grantee }) => grantee)).toEqual([]);
	});

	it('chaque rôle qui lit une table de billing lit aussi tenant_tool_access', async () => {
		const readersMissingAccess = await database`
			select distinct billing_readers.grantee from information_schema.role_table_grants as billing_readers
			where billing_readers.table_schema = 'billing' and billing_readers.privilege_type = 'SELECT'
				and billing_readers.grantee <> 'PUBLIC'
				and not exists (
					select 1 from information_schema.role_table_grants as access_readers
					where access_readers.table_schema = 'billing' and access_readers.table_name = 'tenant_tool_access'
						and access_readers.privilege_type = 'SELECT' and access_readers.grantee = billing_readers.grantee)`;
		expect(readersMissingAccess.map(({ grantee }) => grantee)).toEqual([]);
	});
});
