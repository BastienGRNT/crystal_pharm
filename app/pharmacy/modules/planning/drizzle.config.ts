import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

const repositoryEnvironmentFile = '../../../../.env';

if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/server/db/planningTables.ts',
	out: './src/server/db/migrations',
	schemaFilter: ['planning'],
	migrations: { schema: 'planning', table: '__drizzle_migrations' },
	dbCredentials: { url: process.env.DATABASE_URL ?? '' }
});
