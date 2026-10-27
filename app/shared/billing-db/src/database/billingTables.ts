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
import { boolean, check, index, integer, jsonb, pgPolicy, pgSchema, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import type { ToolCoverage } from '../pricing/toolPricing';
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

/** Les réglages du catalogue : une seule ligne (`id` = 1). */
export const catalogSettings = billingSchema.table(
	'catalog_settings',
	{
		id: integer('id').primaryKey().default(1),
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

/** `active` : à jour · `past_due` : un prélèvement a raté, on relance · `ended` : relances épuisées. */
export type SubscriptionStatus = 'active' | 'past_due' | 'ended';

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
		providerSubscriptionReference: text('provider_subscription_reference'),
		status: text('status').$type<SubscriptionStatus>().notNull().default('active'),
		/** Les prélèvements ratés d'affilée, depuis le dernier qui a réussi. */
		failedAttempts: integer('failed_attempts').notNull().default(0),
		firstFailedAt: timestampWithTimeZone('first_failed_at'),
		nextRetryAt: timestampWithTimeZone('next_retry_at')
	},
	(table) => [
		index('tenant_subscriptions_tenant_id_index').on(table.tenantId),
		index('tenant_subscriptions_due_index').on(table.status, table.billedUntil),
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

/** Une offre vendue (un Tool seul, un pack…) : son identité ne change jamais, ses prix vivent dans ses versions. */
export const offers = billingSchema.table(
	'offers',
	{
		offerKey: text('offer_key').primaryKey(),
		label: text('label').notNull(),
		/** En vente : proposée aux nouveaux abonnés. Hors vente, elle reste servie à ceux qui l'ont. */
		isOnSale: boolean('is_on_sale').notNull().default(true),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	() => [
		pgPolicy('offers_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('offers_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/** Une version d'une offre : ses Tools et son prix, figés à la publication. Une correction = une nouvelle version. */
export const offerVersions = billingSchema.table(
	'offer_versions',
	{
		id: uuid('id').primaryKey(),
		offerKey: text('offer_key')
			.notNull()
			.references(() => offers.offerKey, { onDelete: 'cascade' }),
		versionNumber: integer('version_number').notNull(),
		monthlyPriceCents: integer('monthly_price_cents').notNull(),
		publishedAt: timestampWithTimeZone('published_at').notNull().defaultNow()
	},
	(table) => [
		unique('offer_versions_number_per_offer').on(table.offerKey, table.versionNumber),
		check('offer_versions_price_is_positive', sql`monthly_price_cents >= 0`),
		pgPolicy('offer_versions_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('offer_versions_published_by_platform', { for: 'insert', withCheck: isPlatform })
	]
);

export const offerVersionTools = billingSchema.table(
	'offer_version_tools',
	{
		offerVersionId: uuid('offer_version_id')
			.notNull()
			.references(() => offerVersions.id, { onDelete: 'cascade' }),
		toolKey: text('tool_key').$type<ToolKey>().notNull()
	},
	(table) => [
		primaryKey({ columns: [table.offerVersionId, table.toolKey] }),
		pgPolicy('offer_version_tools_readable_by_everyone', { for: 'select', using: sql`true` }),
		pgPolicy('offer_version_tools_published_by_platform', { for: 'insert', withCheck: isPlatform })
	]
);

/** Un prix négocié pour une offre, au nom d'un Tenant ou d'un groupement : un plafond, à vie sans date de fin. */
export const priceAgreements = billingSchema.table(
	'price_agreements',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id').references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		offerKey: text('offer_key')
			.notNull()
			.references(() => offers.offerKey, { onDelete: 'cascade' }),
		monthlyPriceCents: integer('monthly_price_cents').notNull(),
		startsAt: timestampWithTimeZone('starts_at').notNull().defaultNow(),
		endsAt: timestampWithTimeZone('ends_at'),
		createdAt: timestampWithTimeZone('created_at').notNull().defaultNow()
	},
	(table) => [
		index('price_agreements_tenant_id_index').on(table.tenantId, table.offerKey),
		index('price_agreements_group_id_index').on(table.groupId, table.offerKey),
		check('price_agreements_have_one_beneficiary', sql`(tenant_id is null) <> (group_id is null)`),
		check('price_agreements_price_is_positive', sql`monthly_price_cents >= 0`),
		pgPolicy('price_agreements_readable_by_their_beneficiary', {
			for: 'select',
			using: sql`tenant_id = ${activeTenantId} or group_id = ${activeGroupId} or ${isPlatform} or group_id in (${groupsKnownByActivePharmacy})`
		}),
		pgPolicy('price_agreements_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/** Une version d'un contrat de groupement : ce qu'il prévoyait entre deux dates. Jamais modifiée, sauf sa fin. */
export const groupContractVersions = billingSchema.table(
	'group_contract_versions',
	{
		id: uuid('id').primaryKey(),
		groupId: uuid('group_id')
			.notNull()
			.references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		versionNumber: integer('version_number').notNull(),
		paymentMethod: text('payment_method').$type<GroupPaymentMethod>().notNull(),
		billingMode: text('billing_mode').$type<GroupBillingMode>().notNull(),
		flatRateMonthlyPriceCents: integer('flat_rate_monthly_price_cents'),
		coverages: jsonb('coverages').$type<ToolCoverage[]>().notNull(),
		startsAt: timestampWithTimeZone('starts_at').notNull().defaultNow(),
		endsAt: timestampWithTimeZone('ends_at')
	},
	(table) => [
		unique('group_contract_versions_number_per_group').on(table.groupId, table.versionNumber),
		index('group_contract_versions_group_id_index').on(table.groupId, table.endsAt),
		pgPolicy('group_contract_versions_readable_by_their_group_and_pharmacies', {
			for: 'select',
			using: sql`group_id = ${activeGroupId} or ${isPlatform} or group_id in (${groupsKnownByActivePharmacy})`
		}),
		pgPolicy('group_contract_versions_written_by_platform', { for: 'all', using: isPlatform, withCheck: isPlatform })
	]
);

/**
 * Une offre de l'abonnement : sa version, le prix facturé (figé à l'écriture :
 * le plus bas de la version et de l'accord) et la version vers laquelle elle
 * bascule au prochain renouvellement. Retirée, elle reste active jusqu'à `ends_at`.
 */
export const tenantSubscriptionItems = billingSchema.table(
	'tenant_subscription_items',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		subscriptionId: uuid('subscription_id')
			.notNull()
			.references(() => tenantSubscriptions.id, { onDelete: 'cascade' }),
		offerVersionId: uuid('offer_version_id')
			.notNull()
			.references(() => offerVersions.id),
		nextOfferVersionId: uuid('next_offer_version_id').references(() => offerVersions.id),
		billedMonthlyPriceCents: integer('billed_monthly_price_cents').notNull(),
		priceAgreementId: uuid('price_agreement_id').references(() => priceAgreements.id, { onDelete: 'set null' }),
		startedAt: timestampWithTimeZone('started_at').notNull().defaultNow(),
		endsAt: timestampWithTimeZone('ends_at')
	},
	(table) => [
		index('tenant_subscription_items_tenant_id_index').on(table.tenantId, table.subscriptionId),
		index('tenant_subscription_items_next_version_index').on(table.nextOfferVersionId),
		check('tenant_subscription_items_price_is_positive', sql`billed_monthly_price_cents >= 0`),
		pgPolicy('tenant_subscription_items_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('tenant_subscription_items_readable_by_their_group', {
			for: 'select',
			using: sql`tenant_id in (${tenantsCoveredByActiveGroup})`
		})
	]
);

/**
 * La projection : ce à quoi un Tenant a droit, un Tool par ligne. Écrite
 * uniquement par `rebuildToolAccessOfTenant`, lue en une requête.
 * `ends_at` : `paid_until` + 7 jours de grâce pour un abonnement qui continue,
 * `paid_until` pile pour ce qui est résilié ou pris en charge.
 */
export const tenantToolAccess = billingSchema.table(
	'tenant_tool_access',
	{
		tenantId: uuid('tenant_id')
			.notNull()
			.references(() => tenants.id, { onDelete: 'cascade' }),
		toolKey: text('tool_key').$type<ToolKey>().notNull(),
		startsAt: timestampWithTimeZone('starts_at').notNull(),
		paidUntil: timestampWithTimeZone('paid_until').notNull(),
		endsAt: timestampWithTimeZone('ends_at').notNull(),
		/** `subscription`, ou l'identifiant du groupement qui prend le Tool en charge. */
		grantedBy: text('granted_by').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.tenantId, table.toolKey, table.grantedBy] }),
		index('tenant_tool_access_tenant_id_ends_at_index').on(table.tenantId, table.endsAt),
		pgPolicy('tenant_tool_access_of_active_tenant', {
			for: 'all',
			using: sql`tenant_id = ${activeTenantId} or ${isPlatform}`,
			withCheck: sql`tenant_id = ${activeTenantId} or ${isPlatform}`
		}),
		pgPolicy('tenant_tool_access_readable_by_their_group', {
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

/** `failed` : un prélèvement refusé, gardé pour l'historique ; il ne décide jamais d'un accès. */
export type PaymentStatus = 'paid' | 'refunded' | 'failed';

export const payments = billingSchema.table(
	'payments',
	{
		id: uuid('id').primaryKey(),
		tenantId: uuid('tenant_id').references(() => tenants.id, { onDelete: 'cascade' }),
		groupId: uuid('group_id').references(() => pharmacyGroups.id, { onDelete: 'cascade' }),
		checkoutId: uuid('checkout_id').references(() => checkouts.id, { onDelete: 'set null' }),
		subscriptionId: uuid('subscription_id').references(() => tenantSubscriptions.id, { onDelete: 'set null' }),
		/** Pour un prélèvement d'abonnement : 1 au renouvellement, puis 2, 3… à chaque relance. */
		attemptNumber: integer('attempt_number'),
		amountCents: integer('amount_cents').notNull(),
		description: text('description').notNull(),
		status: text('status').$type<PaymentStatus>().notNull(),
		/** Unique : rejouer un événement du prestataire ne crée pas un deuxième paiement. */
		providerPaymentReference: text('provider_payment_reference').notNull().unique(),
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
