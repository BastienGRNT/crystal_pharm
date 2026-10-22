import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

const repositoryEnvironmentFile = '../../.env';

if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/authentication/platformAuthSchema.ts',
	out: './src/lib/server/authentication/migrations',
	schemaFilter: ['platform_auth'],
	migrations: { schema: 'platform_auth', table: '__drizzle_migrations' },
	dbCredentials: { url: process.env.DATABASE_URL ?? '' }
});
