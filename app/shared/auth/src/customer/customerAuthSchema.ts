import { pgSchema, text, timestamp } from 'drizzle-orm/pg-core';
import { defineBetterAuthTables } from '../toolkit/betterAuthTables';

export const customerAuthSchema = pgSchema('auth');

/** Les colonnes du plugin `username` : seul le CounterAccount a un identifiant, les autres comptes se connectent par email. */
const usernameColumns = {
	username: text('username').unique(),
	displayUsername: text('display_username')
};

export const { users, sessions, accounts, verifications } = defineBetterAuthTables(customerAuthSchema, usernameColumns);

/**
 * Les clés du plugin `jwt` : la publique est servie en JWKS (`/api/auth/jwks`) au C#,
 * qui vérifie ainsi les jetons des TenantMembers ; la privée est chiffrée par le secret de Better Auth.
 */
export const jsonWebKeys = customerAuthSchema.table('jwks', {
	id: text('id').primaryKey(),
	publicKey: text('public_key').notNull(),
	privateKey: text('private_key').notNull(),
	alg: text('alg'),
	crv: text('crv'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
	expiresAt: timestamp('expires_at', { withTimezone: true })
});
