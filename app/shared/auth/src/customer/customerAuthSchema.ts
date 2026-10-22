import { pgSchema } from 'drizzle-orm/pg-core';
import { defineBetterAuthTables } from '../toolkit/betterAuthTables';

export const customerAuthSchema = pgSchema('auth');

export const { users, sessions, accounts, verifications } = defineBetterAuthTables(customerAuthSchema);
