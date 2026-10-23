import {
	activeAccountEmail,
	activeGroupId,
	activeInvitationTokenHash,
	activeTenantId,
	isPlatform
} from '@crystal-pharm/group-db/access-settings';
import { pharmacyGroups } from '@crystal-pharm/group-db/tables';
import { tenants } from '@crystal-pharm/pharmacy-db/tables';
import { sql } from 'drizzle-orm';
import { check, index, integer, jsonb, pgPolicy, pgSchema, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import type { ToolKey } from '../tools/tools';

export const billingSchema = pgSchema('billing');

const timestampWithTimeZone = (columnName: string) => timestamp(columnName, { withTimezone: true });

/** Les membres (et les partis du mois, encore pris en charge) du groupement actif. */
const tenantsCoveredByActiveGroup = sql.raw(
	`select tenant_id from groups.pharmacy_memberships where group_id = nullif(current_setting('app.group_id', true), '')::uuid and (left_at is null or coverage_ends_at > now())`
);

/** Les groupements que la pharmacie active connaît : le sien, ceux qui l'invitent. */
const groupsKnownByActivePharmacy = sql`
	select group_id from groups.pharmacy_memberships where tenant_id = ${activeTenantId}
	union select group_id from groups.pharmacy_invitations where email = ${activeAccountEmail} or token_hash = ${activeInvitationTokenHash}`;

/** Un Tool en vente : une ligne par Tool, absente tant qu'il n'a pas de prix. */
export const toolPrices = billingSchema.table(
	'tool_prices',
	{
		toolKey: text('tool_key').$type<ToolKey>().primaryKey(),
		monthlyPriceCents: integer('monthly_price_cents').notNull(),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	() => [
		check('tool_prices_are_positive', sql`monthly_price_cents >= 0`),
		pgPolicy('tool_prices_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('tool_prices_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/** Les réglages du catalogue : une seule ligne (`id` = 1). */
export const catalogSettings = billingSchema.table(
	'catalog_settings',
	{
		id: integer('id').primaryKey().default(1),
		packMonthlyPriceCents: integer('pack_monthly_price_cents'),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	() => [
		check('catalog_settings_is_a_single_row', sql`id = 1`),
		pgPolicy('catalog_settings_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('catalog_settings_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

export type GroupPaymentMethod = 'invoice' | 'card';
/** `awaiting_payment` : un paiement par carte pas encore fait ; rien n'est pris en charge avant. */
export type GroupContractStatus = 'awaiting_payment' | 'active' | 'suspended';

export const groupContracts = billingSchema.table(
	'group_contracts',
	{
		groupId: uuid('group_id')
			.primaryKey()
			.references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		paymentMethod: text('payment_method').$type<GroupPaymentMethod>().notNull(),
		status: text('status').$type<GroupContractStatus>().notNull(),
		activatedAt: timestampWithTimeZone('activated_at'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	() => [
		pgPolicy('group_contracts_readable_by_their_group_and_pharmacies', {
			for: 'select',
			using: sql`group_id = ${activeGroupId} or ${isPlatform} or group_id in (${groupsKnownByActivePharmacy})`
		}),
		pgPolicy('group_contracts_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

export const groupToolCoverages = billingSchema.table(
	'group_tool_coverages',
	{
		groupId: uuid('group_id')
			.notNull()
			.references(() => groupContracts.groupId, { onDelete: 'cascade' }),
		toolKey: text('tool_key').$type<ToolKey>().notNull(),
		discountPercent: integer('discount_percent').notNull(),
		groupSharePercent: integer('group_share_percent').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.groupId, table.toolKey] }),
		check('group_tool_coverages_discount_is_a_percentage', sql`discount_percent between 0 and 100`),
		check('group_tool_coverages_share_is_a_percentage', sql`group_share_percent between 0 and 100`),
		pgPolicy('group_tool_coverages_readable_by_their_group_and_pharmacies', {
			for: 'select',
			using: sql`group_id = ${activeGroupId} or ${isPlatform} or group_id in (${groupsKnownByActivePharmacy})`
		}),
		pgPolicy('group_tool_coverages_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/**
 * L'abonnement d'un Tenant. Résilié, il garde `ends_at` (la fin de la période
 * payée, ou tout de suite s'il est remboursé).
 */
export const tenantSubscriptions = billingSchema.table(
	'tenant_subscriptions',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		startedAt: timestampWithTimeZone('started_at').notNull().defaultNow(),
		cancelledAt: timestampWithTimeZone('cancelled_at'),
		endsAt: timestampWithTimeZone('ends_at'),
		providerSubscriptionReference: text('provider_subscription_reference')
	},
	(table) => [
		index('tenant_subscriptions_tenant_id_index').on(table.tenantId),
		pgPolicy('tenant_subscriptions_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('tenant_subscriptions_readable_by_their_group', {
			for: 'select',
			using: sql`tenant_id in (${tenantsCoveredByActiveGroup})`
		})
	]
);

/** Un Tool de l'abonnement ; retiré, il reste actif jusqu'à `ends_at`. */
export const tenantSubscriptionTools = billingSchema.table(
	'tenant_subscription_tools',
	{
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		subscriptionId: uuid('subscription_id')
			.notNull()
			.references(() => tenantSubscriptions.id, { onDelete: 'cascade' }),
		toolKey: text('tool_key').$type<ToolKey>().notNull(),
		addedAt: timestampWithTimeZone('added_at').notNull().defaultNow(),
		endsAt: timestampWithTimeZone('ends_at')
	},
	(table) => [
		primaryKey({ columns: [table.subscriptionId, table.toolKey] }),
		index('tenant_subscription_tools_tenant_id_index').on(table.tenantId),
		pgPolicy('tenant_subscription_tools_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('tenant_subscription_tools_readable_by_their_group', {
			for: 'select',
			using: sql`tenant_id in (${tenantsCoveredByActiveGroup})`
		})
	]
);

export type CheckoutPurpose = 'tenant_tools' | 'group_contract';
export type CheckoutStatus = 'open' | 'paid' | 'refused';
export type CheckoutLine = { label: string; amountCents: number };

/** Une page de paiement ouverte (celle du faux prestataire en dev, celle de Stripe plus tard). */
export const checkouts = billingSchema.table(
	'checkouts',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id').references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		purpose: text('purpose').$type<CheckoutPurpose>().notNull(),
		/** Pour `tenant_tools` : tous les Tools voulus une fois le paiement fait. */
		toolKeys: jsonb('tool_keys').$type<ToolKey[]>().notNull().default([]),
		lines: jsonb('lines').$type<CheckoutLine[]>().notNull(),
		amountCents: integer('amount_cents').notNull(),
		description: text('description').notNull(),
		returnPathname: text('return_pathname').notNull(),
		status: text('status').$type<CheckoutStatus>().notNull().default('open'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow(),
		completedAt: timestampWithTimeZone('completed_at')
	},
	(table) => [
		index('checkouts_tenant_id_index').on(table.tenantId),
		index('checkouts_group_id_index').on(table.groupId),
		pgPolicy('checkouts_of_their_payer', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`
		})
	]
);

export type PaymentStatus = 'paid' | 'refunded';

export const payments = billingSchema.table(
	'payments',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id').references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		checkoutId: uuid('checkout_id').references(() => checkouts.id, { onDelete: 'set null' }),
		amountCents: integer('amount_cents').notNull(),
		description: text('description').notNull(),
		status: text('status').$type<PaymentStatus>().notNull(),
		providerPaymentReference: text('provider_payment_reference').notNull(),
		paidAt: timestampWithTimeZone('paid_at').notNull().defaultNow(),
		refundedAt: timestampWithTimeZone('refunded_at')
	},
	(table) => [
		index('payments_tenant_id_index').on(table.tenantId),
		index('payments_group_id_index').on(table.groupId),
		pgPolicy('payments_of_their_payer', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`
		})
	]
);
