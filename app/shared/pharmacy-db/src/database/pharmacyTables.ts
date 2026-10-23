import { users } from '@crystal-pharm/auth/customer-tables';
import { sql } from 'drizzle-orm';
import { index, jsonb, pgPolicy, pgSchema, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { WeeklyOpeningSchedule } from '../opening-hours/weeklyOpeningSchedule';

export const pharmacySchema = pgSchema('pharmacy');

// Posés par transaction (`set_config(…, true)`, l'équivalent de `SET LOCAL`) par
// `runAsTenant` et `runAsAccount`. Une fois posé dans une connexion, un réglage
// vaut '' après la transaction : `nullif` le ramène à NULL, qui ne donne accès à rien.
const activeTenantId = sql.raw(`nullif(current_setting('app.tenant_id', true), '')::uuid`);
const activeAccountId = sql.raw(`nullif(current_setting('app.account_id', true), '')`);

const timestampWithTimeZone = (columnName: string) => timestamp(columnName, { withTimezone: true });

export const tenants = pharmacySchema.table(
	'tenants',
	{
		id: uuid('id').primaryKey(),
		name: text('name').notNull(),
		street: text('street').notNull(),
		postalCode: text('postal_code').notNull(),
		city: text('city').notNull(),
		/** Au format de `PhoneNumber.toStorageFormat`. */
		phoneNumber: text('phone_number').notNull(),
		email: text('email'),
		/** `null` tant que la pharmacie n'a pas saisi ses horaires. */
		weeklyOpeningSchedule: jsonb('weekly_opening_schedule').$type<WeeklyOpeningSchedule>(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	() => [
		pgPolicy('tenants_of_active_tenant_or_account', {
			for: 'all',
			using: sql`id = ${activeTenantId} or id in (select tenant_id from pharmacy.tenant_memberships where account_id = ${activeAccountId})`,
			withCheck: sql`id = ${activeTenantId}`
		})
	]
);

/** Un compte appartient à un ou plusieurs Tenants (un titulaire de plusieurs officines). */
export const tenantMemberships = pharmacySchema.table(
	'tenant_memberships',
	{
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		accountId: text('account_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		primaryKey({ columns: [table.tenantId, table.accountId] }),
		index('tenant_memberships_account_id_index').on(table.accountId),
		pgPolicy('tenant_memberships_of_active_tenant_or_account', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or account_id = ${activeAccountId}`,
			withCheck: sql`tenant_id = ${activeTenantId}`
		})
	]
);
