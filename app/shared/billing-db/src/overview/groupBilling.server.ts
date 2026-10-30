import { getPharmacyGroupForPlatform, listCoveredTenantIdsOfGroup } from '@crystal-pharm/group-db';
import { and, eq, inArray } from 'drizzle-orm';
import { readToolCatalog } from '../catalog/toolCatalog.server';
import { readGroupContract, writeGroupContractStatus, type GroupContract } from '../contracts/groupContracts.server';
import {
	platformBillingAccess,
	runWithBillingAccess,
	type BillingAccess,
	type BillingTransaction
} from '../database/billingDatabase.server';
import {
	groupContracts,
	tenantSubscriptions,
	type BillingPeriod,
	type InvoiceLine
} from '../database/billingTables';
import { addVat } from '../invoicing/vatAmounts';
import { formatEuros } from '../money/euroAmount';
import { isSubscriptionNotEndedAt } from '../events/subscriptionEventSupport.server';
import { openCheckout } from '../payments/checkoutSessions.server';
import { priceForPeriod, spreadLinesOverPeriod } from '../pricing/billingPeriodPricing';
import { computeGroupMonthlyCharge, type GroupCharge } from '../pricing/groupCharge';
import { quoteTools, type ToolCatalog } from '../pricing/toolPricing';
import { findTool, toolKeys, type ToolKey } from '../tools/tools';
import { readSubscribedToolLines } from '../subscriptions/subscribedTools.server';
import { computePeriodEnd } from '../subscriptions/subscriptionPeriod';

/** Ce que coûte une pharmacie au groupement, et ce qu'elle utilise. */
export type CoveredPharmacyBilling = {
	tenantId: string;
	activeToolKeys: ToolKey[];
	/** À l'usage : ce que cette pharmacie coûte au groupement, Tool par Tool. */
	groupCostCentsByToolKey: Partial<Record<ToolKey, number>>;
	groupMonthlyCostCents: number;
};

/** Le prochain prélèvement (carte) ou la prochaine facture (virement), TVA comprise. */
export type UpcomingCharge = {
	dueOn: Date;
	/** Ce que couvre ce paiement : un mois, ou un an. */
	billingPeriod: BillingPeriod;
	subtotalCents: number;
	vatCents: number;
	totalCents: number;
};

export type GroupBillingOverview = {
	catalog: ToolCatalog;
	contract: GroupContract | undefined;
	pharmacyQuota: number;
	memberPharmacyCount: number;
	/** Ce que le groupement paie chaque mois (HT) : à l'usage, ou son forfait et ses dépassements. */
	charge: GroupCharge;
	groupMonthlyCostCents: number;
	upcomingCharge: UpcomingCharge | undefined;
	coveredPharmacies: CoveredPharmacyBilling[];
	/** Combien de pharmacies prises en charge utilisent chaque Tool. */
	activePharmacyCountByToolKey: Partial<Record<ToolKey, number>>;
};

export type GroupContractPaymentRequest =
	| { outcome: 'checkout'; checkoutLocation: string }
	| { outcome: 'activated' }
	| { outcome: 'refused'; failureMessage: string };

export async function getGroupBillingOverview(access: BillingAccess, groupId: string): Promise<GroupBillingOverview> {
	const [coveredTenantIds, group] = await Promise.all([
		listCoveredTenantIdsOfGroup(access, groupId, new Date()),
		getPharmacyGroupForPlatform(groupId)
	]);
	return runWithBillingAccess(access, async (transaction) => {
		const catalog = await readToolCatalog(transaction);
		const contract = await readGroupContract(transaction, groupId);
		const subscribedToolKeysByTenantId = await readSubscribedToolKeys(transaction, coveredTenantIds);

		const coveredPharmacies = coveredTenantIds.map((tenantId): CoveredPharmacyBilling => {
			const quote = quoteTools({
				catalog,
				coverages: contract?.coverages ?? [],
				selectedToolKeys: subscribedToolKeysByTenantId.get(tenantId) ?? []
			});
			const activeToolQuotes = quote.toolQuotes.filter((toolQuote) => toolQuote.isActive);
			return {
				tenantId,
				activeToolKeys: activeToolQuotes.map((toolQuote) => toolQuote.toolKey),
				groupCostCentsByToolKey: Object.fromEntries(activeToolQuotes.map((toolQuote) => [toolQuote.toolKey, toolQuote.groupPriceCents])),
				groupMonthlyCostCents: quote.groupMonthlyTotalCents
			};
		});
		const activePharmacyCountByToolKey: Partial<Record<ToolKey, number>> = {};
		for (const toolKey of coveredPharmacies.flatMap((coveredPharmacy) => coveredPharmacy.activeToolKeys)) {
			activePharmacyCountByToolKey[toolKey] = (activePharmacyCountByToolKey[toolKey] ?? 0) + 1;
		}
		const charge = computeGroupMonthlyCharge({
			billingMode: contract?.billingMode ?? 'usage',
			flatRateMonthlyPriceCents: contract?.flatRateMonthlyPriceCents,
			pharmacyQuota: group?.pharmacyQuota ?? 0,
			memberPharmacyCount: group?.memberPharmacyCount ?? 0,
			usageMonthlyCostCents: coveredPharmacies.reduce((total, coveredPharmacy) => total + coveredPharmacy.groupMonthlyCostCents, 0)
		});
		return {
			catalog,
			contract,
			pharmacyQuota: group?.pharmacyQuota ?? 0,
			memberPharmacyCount: group?.memberPharmacyCount ?? 0,
			charge,
			groupMonthlyCostCents: charge.monthlyTotalCents,
			upcomingCharge:
				contract?.status === 'active' && contract.billedUntil
					? {
							dueOn: contract.billedUntil,
							billingPeriod: contract.billingPeriod,
							...addVat(priceForPeriod(charge.monthlyTotalCents, contract.billingPeriod, catalog.annualFreeMonths))
						}
					: undefined,
			coveredPharmacies,
			activePharmacyCountByToolKey
		};
	});
}

/** Les lignes d'une facture du groupement pour sa période (un mois, ou un an avec ses mois offerts). */
export function describeGroupChargeLines(overview: GroupBillingOverview): InvoiceLine[] {
	return spreadLinesOverPeriod(
		describeMonthlyGroupChargeLines(overview),
		overview.contract?.billingPeriod ?? 'monthly',
		overview.catalog.annualFreeMonths
	);
}

/** Un mois du groupement : son forfait et ses dépassements, ou ses pharmacies module par module. */
function describeMonthlyGroupChargeLines(overview: GroupBillingOverview): InvoiceLine[] {
	const { charge } = overview;
	if (overview.contract?.billingMode === 'flat_rate') {
		return [
			{ label: `Forfait groupement · ${overview.pharmacyQuota} pharmacies`, amountCents: charge.flatRateCents },
			...(charge.overagePharmacyCount > 0
				? [
						{
							label: `${charge.overagePharmacyCount} pharmacie(s) au-delà du forfait × ${formatEuros(charge.overageUnitPriceCents)}`,
							amountCents: charge.overageCents
						}
					]
				: [])
		];
	}
	return toolKeys.flatMap((toolKey) => {
		const pharmaciesUsingTool = overview.coveredPharmacies.filter((coveredPharmacy) => coveredPharmacy.groupCostCentsByToolKey[toolKey]);
		const amountCents = pharmaciesUsingTool.reduce((total, coveredPharmacy) => total + (coveredPharmacy.groupCostCentsByToolKey[toolKey] ?? 0), 0);
		return amountCents > 0
			? [{ label: `Module ${findTool(toolKey).label} · ${pharmaciesUsingTool.length} pharmacie(s)`, amountCents }]
			: [];
	});
}

/**
 * Un contrat payé par carte s'active au premier paiement du groupement. Rien
 * à payer (aucune pharmacie encore, à l'usage) : il s'active tout de suite.
 */
export async function requestGroupContractPayment(groupId: string, returnPathname: string): Promise<GroupContractPaymentRequest> {
	const overview = await getGroupBillingOverview({ groupId }, groupId);
	if (overview.contract?.paymentMethod !== 'card' || overview.contract.status !== 'awaiting_payment') {
		return { outcome: 'refused', failureMessage: 'Ce contrat n’attend aucun paiement par carte.' };
	}
	const periodWording = overview.contract.billingPeriod === 'yearly' ? 'pour un an' : 'pour un mois';
	const lines = describeGroupChargeLines(overview);
	const subtotalCents = lines.reduce((total, line) => total + line.amountCents, 0);
	if (subtotalCents === 0) {
		await activateGroupContractForOnePeriod(groupId);
		return { outcome: 'activated' };
	}
	return runWithBillingAccess({ groupId }, async (transaction) => {
		const checkoutLocation = await openCheckout(
			transaction,
			{ groupId },
			{
				purpose: 'group_contract',
				lines,
				amountCents: addVat(subtotalCents).totalCents,
				description: `Contrat de groupement Crystal Pharm : ${formatEuros(subtotalCents)} HT ${periodWording}`,
				returnPathname
			}
		);
		return { outcome: 'checkout', checkoutLocation };
	});
}

/** La première période est réglée (ou rien n'était dû) : la prochaine facture tombe un mois, ou un an, plus tard. */
export async function activateGroupContractForOnePeriod(groupId: string): Promise<Date> {
	const now = new Date();
	const contract = await runWithBillingAccess(platformBillingAccess, (transaction) => readGroupContract(transaction, groupId));
	const nextBillingDate = computePeriodEnd(now, contract?.billingPeriod ?? 'monthly');
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		await writeGroupContractStatus(transaction, groupId, 'active');
		await transaction.update(groupContracts).set({ billedUntil: nextBillingDate }).where(eq(groupContracts.groupId, groupId));
	});
	return nextBillingDate;
}

async function readSubscribedToolKeys(
	transaction: BillingTransaction,
	tenantIds: readonly string[]
): Promise<Map<string, ToolKey[]>> {
	const subscribedToolKeysByTenantId = new Map<string, ToolKey[]>();
	if (tenantIds.length === 0) return subscribedToolKeysByTenantId;
	const now = new Date();
	const subscriptionRows = await transaction
		.select({ id: tenantSubscriptions.id, tenantId: tenantSubscriptions.tenantId })
		.from(tenantSubscriptions)
		.where(
			and(inArray(tenantSubscriptions.tenantId, [...tenantIds]), isSubscriptionNotEndedAt(now))
		);
	const tenantIdBySubscriptionId = new Map(subscriptionRows.map((subscriptionRow) => [subscriptionRow.id, subscriptionRow.tenantId]));
	for (const toolLine of await readSubscribedToolLines(transaction, [...tenantIdBySubscriptionId.keys()], now)) {
		const tenantId = tenantIdBySubscriptionId.get(toolLine.subscriptionId);
		if (tenantId === undefined) continue;
		subscribedToolKeysByTenantId.set(tenantId, [...(subscribedToolKeysByTenantId.get(tenantId) ?? []), toolLine.toolKey]);
	}
	return subscribedToolKeysByTenantId;
}
