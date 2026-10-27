import { boolean, index, text, timestamp, type PgColumnBuilderBase, type PgSchema } from 'drizzle-orm/pg-core';

const timestampWithTimeZone = (columnName: string) => timestamp(columnName, { withTimezone: true });

const createdAndUpdatedTimestamps = () => ({
	createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
	updatedAt: timestampWithTimeZone('updated_at')
		.notNull()
		.defaultNow()
		.$onUpdate(() => new Date())
});

// Les tables du cœur de Better Auth, posées dans le schéma de l'identité qui
// les possède (`auth` pour les clients, `platform_auth` pour la Platform) ; une
// identité y ajoute les colonnes de ses plugins (`extraUserColumns`).
export function defineBetterAuthTables<ExtraUserColumns extends Record<string, PgColumnBuilderBase> = {}>(
	databaseSchema: PgSchema,
	extraUserColumns: ExtraUserColumns = {} as ExtraUserColumns
) {
	const users = databaseSchema.table('users', {
		...extraUserColumns,
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		// Vides pour les comptes créés avant leur ajout ; obligatoires à l'inscription.
		firstName: text('first_name').notNull().default(''),
		lastName: text('last_name').notNull().default(''),
		email: text('email').notNull().unique(),
		emailVerified: boolean('email_verified').notNull().default(false),
		image: text('image'),
		...createdAndUpdatedTimestamps()
	});

	const sessions = databaseSchema.table(
		'sessions',
		{
			id: text('id').primaryKey(),
			token: text('token').notNull().unique(),
			expiresAt: timestampWithTimeZone('expires_at').notNull(),
			ipAddress: text('ip_address'),
			userAgent: text('user_agent'),
			userId: text('user_id')
				.notNull()
				.references(() => users.id, { onDelete: 'cascade' }),
			...createdAndUpdatedTimestamps()
		},
		(table) => [index('sessions_user_id_index').on(table.userId)]
	);

	const accounts = databaseSchema.table(
		'accounts',
		{
			id: text('id').primaryKey(),
			accountId: text('account_id').notNull(),
			providerId: text('provider_id').notNull(),
			userId: text('user_id')
				.notNull()
				.references(() => users.id, { onDelete: 'cascade' }),
			accessToken: text('access_token'),
			refreshToken: text('refresh_token'),
			idToken: text('id_token'),
			accessTokenExpiresAt: timestampWithTimeZone('access_token_expires_at'),
			refreshTokenExpiresAt: timestampWithTimeZone('refresh_token_expires_at'),
			scope: text('scope'),
			password: text('password'),
			...createdAndUpdatedTimestamps()
		},
		(table) => [index('accounts_user_id_index').on(table.userId)]
	);

	const verifications = databaseSchema.table(
		'verifications',
		{
			id: text('id').primaryKey(),
			identifier: text('identifier').notNull(),
			value: text('value').notNull(),
			expiresAt: timestampWithTimeZone('expires_at').notNull(),
			...createdAndUpdatedTimestamps()
		},
		(table) => [index('verifications_identifier_index').on(table.identifier)]
	);

	return { users, sessions, accounts, verifications };
}

export type BetterAuthTables = ReturnType<typeof defineBetterAuthTables>;

export function toBetterAuthDrizzleSchema({ users, sessions, accounts, verifications }: BetterAuthTables) {
	return { user: users, session: sessions, account: accounts, verification: verifications };
}
