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
const readableTenantIds = sql.raw(
	`string_to_array(nullif(current_setting('app.readable_tenant_ids', true), ''), ',')::uuid[]`
);
const isPlatform = sql.raw(`current_setting('app.is_platform', true) = 'on'`);

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
			using: sql`id = ${activeTenantId} or id in (select tenant_id from pharmacy.tenant_memberships where account_id = ${activeAccountId}) or ${isPlatform}`,
			withCheck: sql`id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('tenants_readable_by_their_group', {
			for: 'select',
			using: sql`id = any(${readableTenantIds})`
		})
	]
);

/** Une personne de l'équipe d'un Tenant, avec ou sans compte. */
export const employees = pharmacySchema.table(
	'employees',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		/** Au format de `FirstName.toStorageFormat`. */
		firstName: text('first_name').notNull(),
		/** Au format de `LastName.toStorageFormat`. */
		lastName: text('last_name').notNull(),
		/** Au format de `JobTitle.toStorageFormat`. */
		jobTitle: text('job_title').notNull(),
		/** `null` sans photo ; sinon l'identifiant de son fichier (cf. `employeePhotoFiles`). */
		photoId: uuid('photo_id'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	(table) => [
		index('employees_tenant_id_created_at_index').on(table.tenantId, table.createdAt),
		pgPolicy('employees_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
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
			using: sql`tenant_id = ${activeTenantId} or account_id = ${activeAccountId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		})
	]
);
