import { existsSync } from 'node:fs';
import { defineConfig } from 'drizzle-kit';

const repositoryEnvironmentFile = '../../../.env';

if (existsSync(repositoryEnvironmentFile)) process.loadEnvFile(repositoryEnvironmentFile);

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/customer/customerAuthSchema.ts',
	out: './src/customer/migrations',
	schemaFilter: ['auth'],
	migrations: { schema: 'auth', table: '__drizzle_migrations' },
	dbCredentials: { url: process.env.DATABASE_URL ?? '' }
});
