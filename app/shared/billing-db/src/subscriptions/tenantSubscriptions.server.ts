import { findCoveringGroupOfTenant } from '@crystal-pharm/group-db';
import { and, desc, eq, gt, gte, isNull, or } from 'drizzle-orm';
import { readToolCatalog } from '../catalog/toolCatalog.server';
import { readGroupContract } from '../contracts/groupContracts.server';
import { runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { payments, tenantSubscriptions, tenantSubscriptionTools } from '../database/billingTables';
import type { GroupContractStatus } from '../database/billingTables';
import { formatEuros } from '../money/euroAmount';
import { openCheckout } from '../payments/checkoutSessions.server';
import { getPaymentProvider } from '../payments/paymentProvider';
import { quoteTools, type ToolCatalog, type ToolCoverage, type ToolsQuote } from '../pricing/toolPricing';
import { findTool, type ToolKey } from '../tools/tools';
import { computeCurrentPeriodEnd, computeMoneyBackGuaranteeEnd } from './subscriptionPeriod';

export type SubscribedTool = {
	toolKey: ToolKey;
	/** Retiré de l'abonnement : reste actif jusqu'à cette date. */
	endsAt: Date | undefined;
};

export type TenantSubscription = {
	subscriptionId: string;
	startedAt: Date;
	currentPeriodEndsAt: Date;
	/** Résilié : la date où il s'arrête. */
	endsAt: Date | undefined;
	moneyBackGuaranteeEndsAt: Date;
	isMoneyBackGuaranteed: boolean;
	tools: SubscribedTool[];
};

/** Le groupement qui prend en charge la pharmacie, et ce que prévoit son contrat. */
export type CoveringGroup = {
	groupId: string;
	groupName: string;
	/** La pharmacie a quitté le groupement : la prise en charge s'arrête à cette date. */
	coverageEndsAt: Date | undefined;
	contractStatus: GroupContractStatus | undefined;
	/** Vide tant que le contrat n'est pas actif. */
	coverages: ToolCoverage[];
};

export type TenantToolAccess = {
	catalog: ToolCatalog;
	coveringGroup: CoveringGroup | undefined;
	subscription: TenantSubscription | undefined;
	quote: ToolsQuote;
	accessibleToolKeys: ToolKey[];
};

export type ToolSelectionRequest =
	| { outcome: 'checkout'; checkoutLocation: string }
	| { outcome: 'applied' }
	| { outcome: 'refused'; failureMessage: string };

export type SubscriptionCancellation =
	| { outcome: 'refunded'; refundedAmountCents: number }
	| { outcome: 'ends-at-period-end'; endsAt: Date }
	| { outcome: 'no-subscription' };

/** Ce que la pharmacie a le droit d'utiliser, et pourquoi (groupement, abonnement, gratuit). */
export function getToolAccessOfTenant(tenantId: string, now = new Date()): Promise<TenantToolAccess> {
	return runWithBillingAccess({ tenantId }, (transaction) => readToolAccessOfTenant(transaction, tenantId, now));
}

export async function readToolAccessOfTenant(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date
): Promise<TenantToolAccess> {
	const catalog = await readToolCatalog(transaction);
	const coveringGroup = await readCoveringGroup(transaction, tenantId, now);
	const subscription = await readCurrentSubscription(transaction, tenantId, now);
	const quote = quoteTools({
		catalog,
		coverages: coveringGroup?.coverages ?? [],
		selectedToolKeys: subscription?.tools.map((subscribedTool) => subscribedTool.toolKey) ?? []
	});
	return {
		catalog,
		coveringGroup,
		subscription,
		quote,
		accessibleToolKeys: quote.toolQuotes.filter((toolQuote) => toolQuote.isActive).map((toolQuote) => toolQuote.toolKey)
	};
}

export async function canTenantUseTool(tenantId: string, toolKey: ToolKey): Promise<boolean> {
	const { accessibleToolKeys } = await getToolAccessOfTenant(tenantId);
	return accessibleToolKeys.includes(toolKey);
}

/**
 * La pharmacie choisit ses Tools (ceux du groupement déjà inclus mis à part).
 * Un Tool ajouté passe par le paiement ; un Tool retiré reste actif jusqu'à la
 * fin de la période déjà payée ; un retrait annulé ne coûte rien.
 */
export async function requestToolSelection(
	tenantId: string,
	requestedToolKeys: readonly ToolKey[],
	returnPathname: string
): Promise<ToolSelectionRequest> {
	return runWithBillingAccess({ tenantId }, async (transaction) => {
		const now = new Date();
		const toolAccess = await readToolAccessOfTenant(transaction, tenantId, now);
		const desiredToolKeys = keepToolsToPayFor(toolAccess, requestedToolKeys);
		const subscribedToolKeys = toolAccess.subscription?.tools.map((subscribedTool) => subscribedTool.toolKey) ?? [];
		const addedToolKeys = desiredToolKeys.filter((toolKey) => !subscribedToolKeys.includes(toolKey));

		const coverages = toolAccess.coveringGroup?.coverages ?? [];
		const desiredQuote = quoteTools({ catalog: toolAccess.catalog, coverages, selectedToolKeys: desiredToolKeys });
		const currentlyPaidToolKeys =
			toolAccess.subscription?.tools.filter((subscribedTool) => !subscribedTool.endsAt).map((subscribedTool) => subscribedTool.toolKey) ?? [];
		const currentQuote = quoteTools({ catalog: toolAccess.catalog, coverages, selectedToolKeys: currentlyPaidToolKeys });
		const amountDueCents = Math.max(0, desiredQuote.pharmacyMonthlyTotalCents - currentQuote.pharmacyMonthlyTotalCents);

		if (addedToolKeys.length === 0 || amountDueCents === 0) {
			await applyToolSelection(transaction, tenantId, desiredToolKeys, now);
			return { outcome: 'applied' };
		}

		const checkoutLocation = await openCheckout(
			transaction,
			{ tenantId },
			{
				purpose: 'tenant_tools',
				toolKeys: desiredToolKeys,
				lines: describeCheckoutLines(desiredQuote, desiredToolKeys, currentQuote),
				amountCents: amountDueCents,
				description: `Abonnement Crystal Pharm : ${formatEuros(desiredQuote.pharmacyMonthlyTotalCents)} par mois`,
				returnPathname
			}
		);
		return { outcome: 'checkout', checkoutLocation };
	});
}

/** Le paiement est fait (ou rien n'était dû) : l'abonnement prend exactement ces Tools. */
export async function applyToolSelection(
	transaction: BillingTransaction,
	tenantId: string,
	desiredToolKeys: readonly ToolKey[],
	now: Date
): Promise<void> {
	const subscription =
		(await readCurrentSubscription(transaction, tenantId, now)) ?? (await startSubscription(transaction, tenantId, now));
	if (subscription.endsAt) await resumeSubscriptionRow(transaction, subscription.subscriptionId);

	for (const toolKey of desiredToolKeys) {
		await transaction
			.insert(tenantSubscriptionTools)
			.values({ tenantId, subscriptionId: subscription.subscriptionId, toolKey, addedAt: now })
			.onConflictDoUpdate({
				target: [tenantSubscriptionTools.subscriptionId, tenantSubscriptionTools.toolKey],
				set: { endsAt: null }
			});
	}
	for (const subscribedTool of subscription.tools) {
		if (desiredToolKeys.includes(subscribedTool.toolKey) || subscribedTool.endsAt) continue;
		await endSubscribedTool(transaction, subscription.subscriptionId, subscribedTool.toolKey, subscription.currentPeriodEndsAt);
	}
}

/**
 * Satisfait ou remboursé : dans les 30 premiers jours, tout est remboursé et
 * s'arrête tout de suite ; ensuite, l'abonnement court jusqu'à la fin de la
 * période payée.
 */
export async function cancelSubscription(tenantId: string): Promise<SubscriptionCancellation> {
	return runWithBillingAccess({ tenantId }, async (transaction) => {
		const now = new Date();
		const subscription = await readCurrentSubscription(transaction, tenantId, now);
		if (!subscription || subscription.endsAt) return { outcome: 'no-subscription' };

		if (subscription.isMoneyBackGuaranteed) {
			const refundedAmountCents = await refundPaymentsSince(transaction, tenantId, subscription.startedAt, now);
			await endSubscription(transaction, subscription.subscriptionId, now, now);
			return { outcome: 'refunded', refundedAmountCents };
		}
		await endSubscription(transaction, subscription.subscriptionId, now, subscription.currentPeriodEndsAt);
		return { outcome: 'ends-at-period-end', endsAt: subscription.currentPeriodEndsAt };
	});
}

/** Annule une résiliation tant que l'abonnement court encore. */
export async function resumeSubscription(tenantId: string): Promise<void> {
	await runWithBillingAccess({ tenantId }, async (transaction) => {
		const subscription = await readCurrentSubscription(transaction, tenantId, new Date());
		if (subscription?.endsAt) await resumeSubscriptionRow(transaction, subscription.subscriptionId);
	});
}

/**
 * Après l'arrivée dans un groupement : la pharmacie cesse tout de suite de payer
 * les Tools que le groupement paie désormais en entier.
 */
export async function stopPayingForIncludedTools(tenantId: string): Promise<ToolKey[]> {
	return runWithBillingAccess({ tenantId }, async (transaction) => {
		const now = new Date();
		const toolAccess = await readToolAccessOfTenant(transaction, tenantId, now);
		if (!toolAccess.subscription) return [];
		const includedToolKeys = toolAccess.quote.toolQuotes
			.filter((toolQuote) => toolQuote.isIncluded)
			.map((toolQuote) => toolQuote.toolKey);
		const nowIncludedSubscribedToolKeys = toolAccess.subscription.tools
			.map((subscribedTool) => subscribedTool.toolKey)
			.filter((toolKey) => includedToolKeys.includes(toolKey));
		for (const toolKey of nowIncludedSubscribedToolKeys) {
			await endSubscribedTool(transaction, toolAccess.subscription.subscriptionId, toolKey, now);
		}
		const hasToolLeftToPay = toolAccess.subscription.tools.some(
			(subscribedTool) => !subscribedTool.endsAt && !nowIncludedSubscribedToolKeys.includes(subscribedTool.toolKey)
		);
		if (!hasToolLeftToPay) await endSubscription(transaction, toolAccess.subscription.subscriptionId, now, now);
		return nowIncludedSubscribedToolKeys;
	});
}

function keepToolsToPayFor(toolAccess: TenantToolAccess, requestedToolKeys: readonly ToolKey[]): ToolKey[] {
	return toolAccess.quote.toolQuotes
		.filter((toolQuote) => !toolQuote.isIncluded && requestedToolKeys.includes(toolQuote.toolKey))
		.map((toolQuote) => toolQuote.toolKey);
}

function describeCheckoutLines(desiredQuote: ToolsQuote, desiredToolKeys: readonly ToolKey[], currentQuote: ToolsQuote) {
	const toolLines = desiredQuote.toolQuotes
		.filter((toolQuote) => desiredToolKeys.includes(toolQuote.toolKey))
		.map((toolQuote) => ({ label: `Module ${findTool(toolQuote.toolKey).label}`, amountCents: toolQuote.pharmacyPriceCents }));
	const alreadyPaidLines =
		currentQuote.pharmacyMonthlyTotalCents > 0
			? [{ label: 'Déjà payé pour le mois en cours', amountCents: -currentQuote.pharmacyMonthlyTotalCents }]
			: [];
	return [...toolLines, ...alreadyPaidLines];
}

async function readCoveringGroup(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date
): Promise<CoveringGroup | undefined> {
	const coveringGroupOfTenant = await findCoveringGroupOfTenant(tenantId, now);
	if (!coveringGroupOfTenant) return undefined;
	const contract = await readGroupContract(transaction, coveringGroupOfTenant.groupId);
	return {
		...coveringGroupOfTenant,
		contractStatus: contract?.status,
		coverages: contract?.status === 'active' ? contract.coverages : []
	};
}

async function readCurrentSubscription(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date
): Promise<TenantSubscription | undefined> {
	const [subscriptionRow] = await transaction
		.select()
		.from(tenantSubscriptions)
		.where(
			and(
				eq(tenantSubscriptions.tenantId, tenantId),
				or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, now))
			)
		)
		.orderBy(desc(tenantSubscriptions.startedAt))
		.limit(1);
	if (!subscriptionRow) return undefined;

	const toolRows = await transaction
		.select()
		.from(tenantSubscriptionTools)
		.where(
			and(
				eq(tenantSubscriptionTools.subscriptionId, subscriptionRow.id),
				or(isNull(tenantSubscriptionTools.endsAt), gt(tenantSubscriptionTools.endsAt, now))
			)
		);
	const moneyBackGuaranteeEndsAt = computeMoneyBackGuaranteeEnd(subscriptionRow.startedAt);
	return {
		subscriptionId: subscriptionRow.id,
		startedAt: subscriptionRow.startedAt,
		currentPeriodEndsAt: computeCurrentPeriodEnd(subscriptionRow.startedAt, now),
		endsAt: subscriptionRow.endsAt ?? undefined,
		moneyBackGuaranteeEndsAt,
		isMoneyBackGuaranteed: now < moneyBackGuaranteeEndsAt,
		tools: toolRows.map((toolRow) => ({ toolKey: toolRow.toolKey, endsAt: toolRow.endsAt ?? undefined }))
	};
}

async function startSubscription(transaction: BillingTransaction, tenantId: string, now: Date): Promise<TenantSubscription> {
	const subscriptionId = crypto.randomUUID();
	await transaction.insert(tenantSubscriptions).values({ id: subscriptionId, tenantId, startedAt: now });
	const moneyBackGuaranteeEndsAt = computeMoneyBackGuaranteeEnd(now);
	return {
		subscriptionId,
		startedAt: now,
		currentPeriodEndsAt: computeCurrentPeriodEnd(now, now),
		endsAt: undefined,
		moneyBackGuaranteeEndsAt,
		isMoneyBackGuaranteed: true,
		tools: []
	};
}

async function endSubscribedTool(
	transaction: BillingTransaction,
	subscriptionId: string,
	toolKey: ToolKey,
	endsAt: Date
): Promise<void> {
	await transaction
		.update(tenantSubscriptionTools)
		.set({ endsAt })
		.where(and(eq(tenantSubscriptionTools.subscriptionId, subscriptionId), eq(tenantSubscriptionTools.toolKey, toolKey)));
}

async function endSubscription(
	transaction: BillingTransaction,
	subscriptionId: string,
	cancelledAt: Date,
	endsAt: Date
): Promise<void> {
	await transaction.update(tenantSubscriptions).set({ cancelledAt, endsAt }).where(eq(tenantSubscriptions.id, subscriptionId));
	if (endsAt <= cancelledAt) {
		await transaction
			.update(tenantSubscriptionTools)
			.set({ endsAt })
			.where(and(eq(tenantSubscriptionTools.subscriptionId, subscriptionId), isNull(tenantSubscriptionTools.endsAt)));
	}
}

async function resumeSubscriptionRow(transaction: BillingTransaction, subscriptionId: string): Promise<void> {
	await transaction
		.update(tenantSubscriptions)
		.set({ cancelledAt: null, endsAt: null })
		.where(eq(tenantSubscriptions.id, subscriptionId));
}

async function refundPaymentsSince(
	transaction: BillingTransaction,
	tenantId: string,
	since: Date,
	now: Date
): Promise<number> {
	const paymentsToRefund = await transaction
		.select()
		.from(payments)
		.where(and(eq(payments.tenantId, tenantId), eq(payments.status, 'paid'), gte(payments.paidAt, since)));
	for (const payment of paymentsToRefund) {
		await getPaymentProvider().refundPayment(payment.providerPaymentReference, payment.amountCents);
		await transaction.update(payments).set({ status: 'refunded', refundedAt: now }).where(eq(payments.id, payment.id));
	}
	return paymentsToRefund.reduce((total, payment) => total + payment.amountCents, 0);
}
