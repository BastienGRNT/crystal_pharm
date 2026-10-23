import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

const repositoryEnvironmentFile = '../../../.env';

if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/database/pharmacyTables.ts',
	out: './src/database/migrations',
	schemaFilter: ['pharmacy'],
	migrations: { schema: 'pharmacy', table: '__drizzle_migrations' },
	dbCredentials: { url: process.env.DATABASE_URL ?? '' }
});
