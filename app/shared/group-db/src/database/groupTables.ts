import { users } from '@crystal-pharm/auth/customer-tables';
import { tenants } from '@crystal-pharm/pharmacy-db/tables';
import { sql } from 'drizzle-orm';
import { check, index, integer, pgPolicy, pgSchema, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import {
	activeAccountEmail,
	activeAccountId,
	activeGroupId,
	activeInvitationTokenHash,
	activeTenantId,
	isPlatform
} from './accessSettings';

export const groupsSchema = pgSchema('groups');

const timestampWithTimeZone = (columnName: string) => timestamp(columnName, { withTimezone: true });

export const pharmacyGroups = groupsSchema.table(
	'pharmacy_groups',
	{
		id: uuid('id').primaryKey(),
		name: text('name').notNull(),
		contactEmail: text('contact_email'),
		/** Le nombre maximal de pharmacies membres et d'invitations en attente. */
		pharmacyQuota: integer('pharmacy_quota').notNull(),
		/** `null` sans logo ; sinon l'identifiant de son fichier (cf. `pharmacyGroupImageFiles`). */
		logoId: uuid('logo_id'),
		loyaltyCardImageId: uuid('loyalty_card_image_id'),
		loyaltyCardUrl: text('loyalty_card_url'),
		/** « Retrouvez votre carte de fidélité en pharmacie »… */
		loyaltyCardMessage: text('loyalty_card_message'),
		/** Les modules que ses pharmacies membres ne peuvent pas désactiver sur leur site (noms de `engine/schema`). */
		mandatoryModules: text('mandatory_modules').array().notNull().default(sql`'{}'::text[]`),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	() => [
		check('pharmacy_groups_quota_is_positive', sql`pharmacy_quota >= 0`),
		pgPolicy('pharmacy_groups_readable_by_their_people', {
			for: 'select',
			using: sql`id = ${activeGroupId} or ${isPlatform}
				or id in (select group_id from groups.group_members where account_id = ${activeAccountId})
				or id in (select group_id from groups.pharmacy_memberships where tenant_id = ${activeTenantId})
				or id in (select group_id from groups.pharmacy_invitations where email = ${activeAccountEmail} or token_hash = ${activeInvitationTokenHash})
				or id in (select group_id from groups.group_member_invitations where token_hash = ${activeInvitationTokenHash})`
		}),
		pgPolicy('pharmacy_groups_written_by_platform', {
			for: 'all',
			using: isPlatform,
			withCheck: isPlatform
		}),
		// Ses GroupMembers modifient sa fiche ; le quota ne s'écrit que par `updatePharmacyGroup`, réservée à la Platform.
		pgPolicy('pharmacy_groups_profile_updated_by_its_members', {
			for: 'update',
			using: sql`id = ${activeGroupId}`,
			withCheck: sql`id = ${activeGroupId}`
		})
	]
);

/** Un compte qui travaille pour un groupement (un GroupMember). */
export const groupMembers = groupsSchema.table(
	'group_members',
	{
		groupId: uuid('group_id')
			.notNull()
			.references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		accountId: text('account_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		primaryKey({ columns: [table.groupId, table.accountId] }),
		index('group_members_account_id_index').on(table.accountId),
		pgPolicy('group_members_of_active_group_or_account', {
			for: 'all',
			using: sql`group_id = ${activeGroupId} or account_id = ${activeAccountId} or ${isPlatform}`,
			withCheck: sql`group_id = ${activeGroupId} or ${isPlatform}
				or (account_id = ${activeAccountId} and group_id in (select group_id from groups.group_member_invitations where token_hash = ${activeInvitationTokenHash}))`
		})
	]
);

export const groupMemberInvitations = groupsSchema.table(
	'group_member_invitations',
	{
		id: uuid('id').primaryKey(),
		groupId: uuid('group_id')
			.notNull()
			.references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		/** L'empreinte SHA-256 du jeton envoyé par email : le jeton lui-même n'est jamais stocké. */
		tokenHash: text('token_hash').notNull().unique(),
		expiresAt: timestampWithTimeZone('expires_at').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		acceptedAt: timestampWithTimeZone('accepted_at'),
		revokedAt: timestampWithTimeZone('revoked_at')
	},
	(table) => [
		index('group_member_invitations_group_id_index').on(table.groupId),
		pgPolicy('group_member_invitations_of_active_group_or_token', {
			for: 'all',
			using: sql`group_id = ${activeGroupId} or ${isPlatform} or token_hash = ${activeInvitationTokenHash}`,
			withCheck: sql`group_id = ${activeGroupId} or ${isPlatform} or token_hash = ${activeInvitationTokenHash}`
		})
	]
);

export type MembershipEndedBy = 'pharmacy' | 'group' | 'platform';

/**
 * L'adhésion d'une pharmacie à un groupement, jamais supprimée : son départ
 * pose `left_at` (le groupement ne voit plus ses données) et `coverage_ends_at`
 * (la fin de la prise en charge, à la fin du mois).
 */
export const pharmacyMemberships = groupsSchema.table(
	'pharmacy_memberships',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id')
			.notNull()
			.references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		joinedAt: timestampWithTimeZone('joined_at').notNull().defaultNow(),
		leftAt: timestampWithTimeZone('left_at'),
		coverageEndsAt: timestampWithTimeZone('coverage_ends_at'),
		endedBy: text('ended_by').$type<MembershipEndedBy>()
	},
	(table) => [
		index('pharmacy_memberships_tenant_id_index').on(table.tenantId),
		index('pharmacy_memberships_group_id_index').on(table.groupId),
		uniqueIndex('pharmacy_memberships_one_current_group_per_tenant')
			.on(table.tenantId)
			.where(sql`left_at is null`),
		pgPolicy('pharmacy_memberships_of_active_group_or_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`
		})
	]
);

export const pharmacyInvitations = groupsSchema.table(
	'pharmacy_invitations',
	{
		id: uuid('id').primaryKey(),
		groupId: uuid('group_id')
			.notNull()
			.references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		email: text('email').notNull(),
		/** Le nom donné par le groupement, pour s'y retrouver avant l'acceptation. */
		pharmacyName: text('pharmacy_name'),
		tokenHash: text('token_hash').notNull().unique(),
		expiresAt: timestampWithTimeZone('expires_at').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		lastSentAt: timestampWithTimeZone('last_sent_at').notNull().defaultNow(),
		acceptedAt: timestampWithTimeZone('accepted_at'),
		acceptedTenantId: uuid('accepted_tenant_id').references(() => tenants.id, { onDelete: 'set null' }),
		declinedAt: timestampWithTimeZone('declined_at'),
		revokedAt: timestampWithTimeZone('revoked_at')
	},
	(table) => [
		index('pharmacy_invitations_group_id_index').on(table.groupId),
		index('pharmacy_invitations_email_index').on(table.email),
		pgPolicy('pharmacy_invitations_of_active_group_email_or_token', {
			for: 'all',
			using: sql`group_id = ${activeGroupId} or ${isPlatform} or email = ${activeAccountEmail} or token_hash = ${activeInvitationTokenHash}`,
			withCheck: sql`group_id = ${activeGroupId} or ${isPlatform} or email = ${activeAccountEmail} or token_hash = ${activeInvitationTokenHash}`
		})
	]
);
