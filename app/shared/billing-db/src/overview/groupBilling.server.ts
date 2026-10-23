import { listCoveredTenantIdsOfGroup } from '@crystal-pharm/group-db';
import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm';
import { readToolCatalog } from '../catalog/toolCatalog.server';
import { readGroupContract, type GroupContract } from '../contracts/groupContracts.server';
import { runWithBillingAccess, type BillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { tenantSubscriptions, tenantSubscriptionTools } from '../database/billingTables';
import { formatEuros } from '../money/euroAmount';
import { openCheckout } from '../payments/checkoutSessions.server';
import { quoteTools, type ToolCatalog } from '../pricing/toolPricing';
import type { ToolKey } from '../tools/tools';

/** Ce que coûte une pharmacie au groupement, et ce qu'elle utilise. */
export type CoveredPharmacyBilling = {
	tenantId: string;
	activeToolKeys: ToolKey[];
	groupMonthlyCostCents: number;
};

export type GroupBillingOverview = {
	catalog: ToolCatalog;
	contract: GroupContract | undefined;
	/** Ce que le groupement paie chaque mois, d'après les Tools actifs de ses pharmacies. */
	groupMonthlyCostCents: number;
	coveredPharmacies: CoveredPharmacyBilling[];
	/** Combien de pharmacies prises en charge utilisent chaque Tool. */
	activePharmacyCountByToolKey: Partial<Record<ToolKey, number>>;
};

export type GroupContractPaymentRequest =
	| { outcome: 'checkout'; checkoutLocation: string }
	| { outcome: 'refused'; failureMessage: string };

export async function getGroupBillingOverview(access: BillingAccess, groupId: string): Promise<GroupBillingOverview> {
	const coveredTenantIds = await listCoveredTenantIdsOfGroup(access, groupId, new Date());
	return runWithBillingAccess(access, async (transaction) => {
		const catalog = await readToolCatalog(transaction);
		const contract = await readGroupContract(transaction, groupId);
		const subscribedToolKeysByTenantId = await readSubscribedToolKeys(transaction, coveredTenantIds);

		const coveredPharmacies = coveredTenantIds.map((tenantId) => {
			const quote = quoteTools({
				catalog,
				coverages: contract?.coverages ?? [],
				selectedToolKeys: subscribedToolKeysByTenantId.get(tenantId) ?? []
			});
			return {
				tenantId,
				activeToolKeys: quote.toolQuotes.filter((toolQuote) => toolQuote.isActive).map((toolQuote) => toolQuote.toolKey),
				groupMonthlyCostCents: quote.groupMonthlyTotalCents
			};
		});
		const activePharmacyCountByToolKey: Partial<Record<ToolKey, number>> = {};
		for (const toolKey of coveredPharmacies.flatMap((coveredPharmacy) => coveredPharmacy.activeToolKeys)) {
			activePharmacyCountByToolKey[toolKey] = (activePharmacyCountByToolKey[toolKey] ?? 0) + 1;
		}
		return {
			catalog,
			contract,
			groupMonthlyCostCents: coveredPharmacies.reduce((total, coveredPharmacy) => total + coveredPharmacy.groupMonthlyCostCents, 0),
			coveredPharmacies,
			activePharmacyCountByToolKey
		};
	});
}

/** Un contrat payé par carte s'active au premier paiement du groupement. */
export async function requestGroupContractPayment(groupId: string, returnPathname: string): Promise<GroupContractPaymentRequest> {
	const overview = await getGroupBillingOverview({ groupId }, groupId);
	if (overview.contract?.paymentMethod !== 'card' || overview.contract.status !== 'awaiting_payment') {
		return { outcome: 'refused', failureMessage: 'Ce contrat n’attend aucun paiement par carte.' };
	}
	return runWithBillingAccess({ groupId }, async (transaction) => {
		const checkoutLocation = await openCheckout(
			transaction,
			{ groupId },
			{
				purpose: 'group_contract',
				lines: [{ label: 'Prise en charge de vos pharmacies, premier mois', amountCents: overview.groupMonthlyCostCents }],
				amountCents: overview.groupMonthlyCostCents,
				description: `Contrat de groupement Crystal Pharm : ${formatEuros(overview.groupMonthlyCostCents)} par mois (estimé)`,
				returnPathname
			}
		);
		return { outcome: 'checkout', checkoutLocation };
	});
}

async function readSubscribedToolKeys(
	transaction: BillingTransaction,
	tenantIds: readonly string[]
): Promise<Map<string, ToolKey[]>> {
	const subscribedToolKeysByTenantId = new Map<string, ToolKey[]>();
	if (tenantIds.length === 0) return subscribedToolKeysByTenantId;
	const now = new Date();
	const toolRows = await transaction
		.select({ tenantId: tenantSubscriptionTools.tenantId, toolKey: tenantSubscriptionTools.toolKey })
		.from(tenantSubscriptionTools)
		.innerJoin(tenantSubscriptions, eq(tenantSubscriptions.id, tenantSubscriptionTools.subscriptionId))
		.where(
			and(
				inArray(tenantSubscriptionTools.tenantId, [...tenantIds]),
				or(isNull(tenantSubscriptionTools.endsAt), gt(tenantSubscriptionTools.endsAt, now)),
				or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, now))
			)
		);
	for (const toolRow of toolRows) {
		subscribedToolKeysByTenantId.set(toolRow.tenantId, [
			...(subscribedToolKeysByTenantId.get(toolRow.tenantId) ?? []),
			toolRow.toolKey
		]);
	}
	return subscribedToolKeysByTenantId;
}
