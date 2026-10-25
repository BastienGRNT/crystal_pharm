import type { AuthenticatedUser } from '@crystal-pharm/auth/toolkit';
import { readCoveringGroupOfTenant } from '@crystal-pharm/group-db';
import { and, desc, eq, gt, gte, isNull, or } from 'drizzle-orm';
import { readToolCatalog } from '../catalog/toolCatalog.server';
import { readGroupContract } from '../contracts/groupContracts.server';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { invoices, tenantSubscriptions, tenantSubscriptionTools } from '../database/billingTables';
import { creditInvoice } from '../invoicing/invoices.server';
import { addVat } from '../invoicing/vatAmounts';
import type { UpcomingCharge } from '../overview/groupBilling.server';
import type { BillingPeriod, GroupContractStatus, InvoiceLine } from '../database/billingTables';
import { formatEuros } from '../money/euroAmount';
import { openCheckout } from '../payments/checkoutSessions.server';
import { computeAmountDueToday, priceForPeriod, spreadLinesOverPeriod } from '../pricing/billingPeriodPricing';
import { quoteTools, type ToolCatalog, type ToolCoverage, type ToolsQuote } from '../pricing/toolPricing';
import { findTool, type ToolKey } from '../tools/tools';
import { readCurrentTermsAcceptance, recordCurrentTermsAcceptance } from '../terms/termsAcceptances.server';
import { computeMoneyBackGuaranteeEnd, computePeriodEnd, computePeriodStart } from './subscriptionPeriod';

export type SubscribedTool = {
	toolKey: ToolKey;
	/** Retiré de l'abonnement : reste actif jusqu'à cette date. */
	endsAt: Date | undefined;
};

export type TenantSubscription = {
	subscriptionId: string;
	startedAt: Date;
	billingPeriod: BillingPeriod;
	/** Un changement demandé, qui s'appliquera au prochain renouvellement. */
	nextBillingPeriod: BillingPeriod | undefined;
	currentPeriodStartedAt: Date;
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
	/** Le prochain prélèvement de l'abonnement (TTC), s'il continue. */
	upcomingCharge: UpcomingCharge | undefined;
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
		accessibleToolKeys: quote.toolQuotes.filter((toolQuote) => toolQuote.isActive).map((toolQuote) => toolQuote.toolKey),
		upcomingCharge: describeUpcomingCharge(catalog, coveringGroup?.coverages ?? [], subscription)
	};
}

export async function canTenantUseTool(tenantId: string, toolKey: ToolKey): Promise<boolean> {
	const { accessibleToolKeys } = await getToolAccessOfTenant(tenantId);
	return accessibleToolKeys.includes(toolKey);
}

/**
 * La pharmacie choisit ses Tools (ceux du groupement déjà inclus mis à part) et
 * sa période. Un nouvel abonnement paie sa première période (un mois, ou un an
 * avec ses mois offerts). Ensuite, un Tool ajouté se paie pour le reste de la
 * période en cours (le mois entier, ou l'année au prorata des jours) ; un Tool
 * retiré reste actif jusqu'à la fin de la période payée ; un changement de
 * période s'applique au prochain renouvellement.
 *
 * Ajouter un Tool exige que la pharmacie ait accepté la version en vigueur des
 * conditions : déjà, ou maintenant (`termsAcceptedBy`, la personne qui coche).
 */
export async function requestToolSelection(
	tenantId: string,
	requestedToolKeys: readonly ToolKey[],
	returnPathname: string,
	requestedBillingPeriod: BillingPeriod = 'monthly',
	termsAcceptedBy?: AuthenticatedUser
): Promise<ToolSelectionRequest> {
	return runWithBillingAccess({ tenantId }, async (transaction) => {
		const now = new Date();
		const toolAccess = await readToolAccessOfTenant(transaction, tenantId, now);
		const desiredToolKeys = keepToolsToPayFor(toolAccess, requestedToolKeys);
		const subscribedToolKeys = toolAccess.subscription?.tools.map((subscribedTool) => subscribedTool.toolKey) ?? [];
		const addedToolKeys = desiredToolKeys.filter((toolKey) => !subscribedToolKeys.includes(toolKey));

		if (addedToolKeys.length > 0 && !(await readCurrentTermsAcceptance(transaction, tenantId))) {
			if (!termsAcceptedBy) {
				return { outcome: 'refused', failureMessage: 'Acceptez les conditions générales de vente pour activer vos modules.' };
			}
			await recordCurrentTermsAcceptance(transaction, tenantId, termsAcceptedBy, now);
		}

		const coverages = toolAccess.coveringGroup?.coverages ?? [];
		const desiredQuote = quoteTools({ catalog: toolAccess.catalog, coverages, selectedToolKeys: desiredToolKeys });
		const currentlyPaidToolKeys =
			toolAccess.subscription?.tools.filter((subscribedTool) => !subscribedTool.endsAt).map((subscribedTool) => subscribedTool.toolKey) ?? [];
		const currentQuote = quoteTools({ catalog: toolAccess.catalog, coverages, selectedToolKeys: currentlyPaidToolKeys });
		const lines = describeAmountDueLines({
			subscription: toolAccess.subscription,
			annualFreeMonths: toolAccess.catalog.annualFreeMonths,
			requestedBillingPeriod,
			desiredQuote,
			desiredToolKeys,
			addedToolKeys,
			currentQuote,
			now
		});
		const amountDueCents = Math.max(0, lines.reduce((total, line) => total + line.amountCents, 0));

		if (addedToolKeys.length === 0 || amountDueCents === 0) {
			await applyToolSelection(transaction, tenantId, desiredToolKeys, now, requestedBillingPeriod);
			return { outcome: 'applied' };
		}

		const checkoutLocation = await openCheckout(
			transaction,
			{ tenantId },
			{
				purpose: 'tenant_tools',
				toolKeys: desiredToolKeys,
				billingPeriod: requestedBillingPeriod,
				lines,
				amountCents: addVat(amountDueCents).totalCents,
				description: `Abonnement Crystal Pharm : ${formatEuros(desiredQuote.pharmacyMonthlyTotalCents)} HT par mois`,
				returnPathname
			}
		);
		return { outcome: 'checkout', checkoutLocation };
	});
}

/** Le paiement est fait (ou rien n'était dû) : l'abonnement prend exactement ces Tools, et cette période. */
export async function applyToolSelection(
	transaction: BillingTransaction,
	tenantId: string,
	desiredToolKeys: readonly ToolKey[],
	now: Date,
	requestedBillingPeriod: BillingPeriod
): Promise<void> {
	const subscription =
		(await readCurrentSubscription(transaction, tenantId, now)) ??
		(await startSubscription(transaction, tenantId, now, requestedBillingPeriod));
	if (subscription.endsAt) await resumeSubscriptionRow(transaction, subscription.subscriptionId);
	await transaction
		.update(tenantSubscriptions)
		.set({ nextBillingPeriod: requestedBillingPeriod === subscription.billingPeriod ? null : requestedBillingPeriod })
		.where(eq(tenantSubscriptions.id, subscription.subscriptionId));

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
			const refundedAmountCents = await creditInvoicesIssuedSince(tenantId, subscription.startedAt);
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

type AmountDueRequest = {
	subscription: TenantSubscription | undefined;
	annualFreeMonths: number;
	requestedBillingPeriod: BillingPeriod;
	desiredQuote: ToolsQuote;
	desiredToolKeys: readonly ToolKey[];
	addedToolKeys: readonly ToolKey[];
	currentQuote: ToolsQuote;
	now: Date;
};

/** Ce qu'il faut payer aujourd'hui, ligne à ligne (HT). */
function describeAmountDueLines(request: AmountDueRequest): InvoiceLine[] {
	const { subscription, desiredQuote, currentQuote } = request;
	if (!subscription) {
		return spreadLinesOverPeriod(
			describeMonthlyToolLines(desiredQuote, request.desiredToolKeys),
			request.requestedBillingPeriod,
			request.annualFreeMonths
		);
	}
	if (subscription.billingPeriod === 'monthly') {
		const alreadyPaidLines =
			currentQuote.pharmacyMonthlyTotalCents > 0
				? [{ label: 'Déjà payé pour le mois en cours', amountCents: -currentQuote.pharmacyMonthlyTotalCents }]
				: [];
		return [...describeMonthlyToolLines(desiredQuote, request.desiredToolKeys), ...alreadyPaidLines];
	}
	const amountCents = computeAmountDueToday({
		currentPeriod: {
			billingPeriod: subscription.billingPeriod,
			startedAt: subscription.currentPeriodStartedAt,
			endsAt: subscription.currentPeriodEndsAt
		},
		requestedBillingPeriod: request.requestedBillingPeriod,
		currentMonthlyCents: currentQuote.pharmacyMonthlyTotalCents,
		desiredMonthlyCents: desiredQuote.pharmacyMonthlyTotalCents,
		annualFreeMonths: request.annualFreeMonths,
		now: request.now
	});
	const addedLabels = request.addedToolKeys.map((toolKey) => findTool(toolKey).label).join(', ');
	return [{ label: `Ajout de ${addedLabels}, au prorata jusqu’à la fin de votre année`, amountCents }];
}

/** Un mois, module par module ; au prix du pack, une seule ligne (jamais de prix répartis sur une facture). */
export function describeMonthlyToolLines(quote: ToolsQuote, toolKeys: readonly ToolKey[]): InvoiceLine[] {
	if (quote.isPackApplied) {
		const packLabels = quote.toolQuotes
			.filter((toolQuote) => !toolQuote.isIncludedWithAnotherTool && toolQuote.listPriceCents > 0)
			.map((toolQuote) => findTool(toolQuote.toolKey).label);
		return [{ label: `Pack ${packLabels.join(' + ')}`, amountCents: quote.pharmacyMonthlyTotalCents }];
	}
	return quote.toolQuotes
		.filter((toolQuote) => toolKeys.includes(toolQuote.toolKey) && toolQuote.pharmacyPriceCents > 0)
		.map((toolQuote) => ({ label: `Module ${findTool(toolQuote.toolKey).label}`, amountCents: toolQuote.pharmacyPriceCents }));
}

async function readCoveringGroup(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date
): Promise<CoveringGroup | undefined> {
	const coveringGroupOfTenant = await readCoveringGroupOfTenant(transaction, tenantId, now);
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
		billingPeriod: subscriptionRow.billingPeriod,
		nextBillingPeriod: subscriptionRow.nextBillingPeriod ?? undefined,
		currentPeriodStartedAt: computePeriodStart(subscriptionRow.billedUntil, subscriptionRow.billingPeriod),
		currentPeriodEndsAt: subscriptionRow.billedUntil,
		endsAt: subscriptionRow.endsAt ?? undefined,
		moneyBackGuaranteeEndsAt,
		isMoneyBackGuaranteed: now < moneyBackGuaranteeEndsAt,
		tools: toolRows.map((toolRow) => ({ toolKey: toolRow.toolKey, endsAt: toolRow.endsAt ?? undefined }))
	};
}

async function startSubscription(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date,
	billingPeriod: BillingPeriod
): Promise<TenantSubscription> {
	const subscriptionId = crypto.randomUUID();
	const firstPeriodEnd = computePeriodEnd(now, billingPeriod);
	await transaction
		.insert(tenantSubscriptions)
		.values({ id: subscriptionId, tenantId, startedAt: now, billedUntil: firstPeriodEnd, billingPeriod });
	const moneyBackGuaranteeEndsAt = computeMoneyBackGuaranteeEnd(now);
	return {
		subscriptionId,
		startedAt: now,
		billingPeriod,
		nextBillingPeriod: undefined,
		currentPeriodStartedAt: now,
		currentPeriodEndsAt: firstPeriodEnd,
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

// Satisfait ou remboursé : chaque facture payée depuis le début de l'abonnement
// est annulée par un avoir, et la carte recréditée.
async function creditInvoicesIssuedSince(tenantId: string, since: Date): Promise<number> {
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const paidInvoices = await transaction
			.select({ id: invoices.id })
			.from(invoices)
			.where(
				and(eq(invoices.tenantId, tenantId), eq(invoices.kind, 'invoice'), eq(invoices.status, 'paid'), gte(invoices.issuedAt, since))
			);
		let refundedAmountCents = 0;
		for (const paidInvoice of paidInvoices) refundedAmountCents += await creditInvoice(transaction, paidInvoice.id);
		return refundedAmountCents;
	});
}

function describeUpcomingCharge(
	catalog: ToolCatalog,
	coverages: readonly ToolCoverage[],
	subscription: TenantSubscription | undefined
): UpcomingCharge | undefined {
	if (!subscription || subscription.endsAt) return undefined;
	const continuingToolKeys = subscription.tools.filter((subscribedTool) => !subscribedTool.endsAt).map((subscribedTool) => subscribedTool.toolKey);
	const nextQuote = quoteTools({ catalog, coverages, selectedToolKeys: continuingToolKeys });
	if (nextQuote.pharmacyMonthlyTotalCents === 0) return undefined;
	const billingPeriod = subscription.nextBillingPeriod ?? subscription.billingPeriod;
	return {
		dueOn: subscription.currentPeriodEndsAt,
		billingPeriod,
		...addVat(priceForPeriod(nextQuote.pharmacyMonthlyTotalCents, billingPeriod, catalog.annualFreeMonths))
	};
}
