import { pgSchema } from 'drizzle-orm/pg-core';
import { defineBetterAuthTables } from '@crystal-pharm/auth/tables';

export const platformAuthSchema = pgSchema('platform_auth');

export const { users, sessions, accounts, verifications } = defineBetterAuthTables(platformAuthSchema);
