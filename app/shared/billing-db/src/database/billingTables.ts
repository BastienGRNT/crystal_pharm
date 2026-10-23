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

/** `monthly` : chaque mois · `yearly` : douze mois d'un coup, avec des mois offerts (réglés dans le catalogue). */
export type BillingPeriod = 'monthly' | 'yearly';

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
		/** Payé à l'année : ces mois-là ne sont pas facturés (2 : « 2 mois offerts »). */
		annualFreeMonths: integer('annual_free_months').notNull().default(2),
		updatedAt: timestampWithTimeZone('updated_at')
			.notNull()
			.defaultNow()
			.$onUpdate(() => new Date())
	},
	() => [
		check('catalog_settings_is_a_single_row', sql`id = 1`),
		check('catalog_settings_free_months_fit_in_a_year', sql`annual_free_months between 0 and 11`),
		pgPolicy('catalog_settings_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('catalog_settings_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/** Une offre de forfait du catalogue : un nombre de places pour un prix mensuel fixe. */
export const flatRateOffers = billingSchema.table(
	'flat_rate_offers',
	{
		id: uuid('id').primaryKey(),
		label: text('label').notNull(),
		pharmacyQuota: integer('pharmacy_quota').notNull(),
		monthlyPriceCents: integer('monthly_price_cents').notNull(),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	() => [
		check('flat_rate_offers_are_positive', sql`pharmacy_quota > 0 and monthly_price_cents >= 0`),
		pgPolicy('flat_rate_offers_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('flat_rate_offers_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

export type GroupPaymentMethod = 'invoice' | 'card';
/** `usage` : la somme de ce que coûtent ses pharmacies · `flat_rate` : un forfait mensuel pour son quota. */
export type GroupBillingMode = 'usage' | 'flat_rate';
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
		billingMode: text('billing_mode').$type<GroupBillingMode>().notNull().default('usage'),
		/** Le prix du forfait, pour le quota du groupement ; au-delà, chaque pharmacie coûte forfait ÷ quota. */
		flatRateMonthlyPriceCents: integer('flat_rate_monthly_price_cents'),
		flatRateOfferId: uuid('flat_rate_offer_id').references(() => flatRateOffers.id, { onDelete: 'set null' }),
		billingPeriod: text('billing_period').$type<BillingPeriod>().notNull().default('monthly'),
		activatedAt: timestampWithTimeZone('activated_at'),
		/** La fin de la période déjà facturée : la prochaine facture tombe à cette date. */
		billedUntil: timestampWithTimeZone('billed_until'),
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
		/** La fin de la période déjà payée : le prochain prélèvement tombe à cette date. */
		billedUntil: timestampWithTimeZone('billed_until')
			.notNull()
			.default(sql`now() + interval '1 month'`),
		/** La période en cours (mensuelle ou annuelle). */
		billingPeriod: text('billing_period').$type<BillingPeriod>().notNull().default('monthly'),
		/** Un changement de période demandé : il s'applique au prochain renouvellement. */
		nextBillingPeriod: text('next_billing_period').$type<BillingPeriod>(),
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
		/** Pour `tenant_tools` : la période d'un nouvel abonnement. */
		billingPeriod: text('billing_period').$type<BillingPeriod>().notNull().default('monthly'),
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

export type InvoiceKind = 'invoice' | 'credit_note';
/** `paid` : réglée · `due` : à régler par virement · `credited` : annulée par un avoir (remboursement). */
export type InvoiceStatus = 'paid' | 'due' | 'credited';
export type InvoicePaymentMethod = 'card' | 'transfer';
export type InvoiceLine = { label: string; amountCents: number };

/**
 * Les factures et avoirs, émis par la Platform seule (numérotation continue) ;
 * leur destinataire (pharmacie ou groupement) les lit. Montants : HT, TVA, TTC.
 */
export const invoices = billingSchema.table(
	'invoices',
	{
		id: uuid('id').primaryKey(),
		number: text('number').notNull().unique(),
		kind: text('kind').$type<InvoiceKind>().notNull(),
		tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id').references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		issuedAt: timestampWithTimeZone('issued_at').notNull().defaultNow(),
		periodStart: timestampWithTimeZone('period_start'),
		periodEnd: timestampWithTimeZone('period_end'),
		/** Le nom et l'adresse du client au moment de la facture : une facture ne change plus. */
		customerName: text('customer_name').notNull(),
		customerAddressLines: jsonb('customer_address_lines').$type<string[]>().notNull(),
		lines: jsonb('lines').$type<InvoiceLine[]>().notNull(),
		subtotalCents: integer('subtotal_cents').notNull(),
		vatRatePercent: integer('vat_rate_percent').notNull(),
		vatCents: integer('vat_cents').notNull(),
		totalCents: integer('total_cents').notNull(),
		status: text('status').$type<InvoiceStatus>().notNull(),
		paymentMethod: text('payment_method').$type<InvoicePaymentMethod>().notNull(),
		paymentId: uuid('payment_id').references(() => payments.id, { onDelete: 'set null' }),
		/** Pour un avoir : la facture qu'il annule. */
		creditedInvoiceId: uuid('credited_invoice_id'),
		creditedInvoiceNumber: text('credited_invoice_number'),
		paidAt: timestampWithTimeZone('paid_at')
	},
	(table) => [
		index('invoices_tenant_id_index').on(table.tenantId),
		index('invoices_group_id_index').on(table.groupId),
		pgPolicy('invoices_readable_by_their_customer', {
			for: 'select',
			using: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform}`
		}),
		pgPolicy('invoices_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/** Le dernier numéro de facture émis, par année : une numérotation continue, sans trou. */
export const invoiceSequences = billingSchema.table(
	'invoice_sequences',
	{
		year: integer('year').primaryKey(),
		lastNumber: integer('last_number').notNull()
	},
	() => [pgPolicy('invoice_sequences_of_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })]
);

/** La preuve qu'une pharmacie a accepté les conditions (de vente, de traitement des données) : qui, quand, quelle version. Jamais modifiée. */
export const termsAcceptances = billingSchema.table(
	'terms_acceptances',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		termsVersion: text('terms_version').notNull(),
		/** Le compte, et son nom et son email au moment d'accepter : la preuve survit à leur changement. */
		acceptedByUserId: text('accepted_by_user_id').notNull(),
		acceptedByName: text('accepted_by_name').notNull(),
		acceptedByEmail: text('accepted_by_email').notNull(),
		acceptedAt: timestampWithTimeZone('accepted_at').notNull().defaultNow()
	},
	(table) => [
		index('terms_acceptances_tenant_id_index').on(table.tenantId, table.termsVersion),
		pgPolicy('terms_acceptances_readable_by_active_tenant', {
			for: 'select',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('terms_acceptances_recorded_by_active_tenant', {
			for: 'insert',
			withCheck: sql`tenant_id = ${activeTenantId}`
		})
	]
);
