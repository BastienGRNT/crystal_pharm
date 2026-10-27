import { and, eq, lte } from 'drizzle-orm';
import { listTenantIdsWithAccessSources } from '../access/rebuildToolAccessOfTenant.server';
import { reconcileToolAccessOfTenant } from '../access/toolAccessReconciliation.server';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { groupContracts, type InvoicePaymentMethod } from '../database/billingTables';
import { chargeAndInvoice } from '../invoicing/invoices.server';
import { describeGroupChargeLines, getGroupBillingOverview } from '../overview/groupBilling.server';
import { computePeriodEnd } from '../subscriptions/subscriptionPeriod';
import { listSubscriptionsDueForRenewal, listSubscriptionsDueForRetry, renewSubscription, retryFailedPayment, type RenewalOutcome } from './subscriptionRenewal.server';

export type DueBillingReport = {
	invoicedTenantCount: number;
	invoicedGroupCount: number;
	failedPaymentCount: number;
	abandonedSubscriptionCount: number;
	repairedToolAccessCount: number;
};

/**
 * Le renouvellement mensuel : chaque abonnement et chaque contrat actif dont la
 * période payée est finie est facturé pour la suivante (prélevé par carte, ou
 * « à régler » par virement). En prod, une tâche planifiée l'appellera chaque
 * jour ; en dev, l'outil de dev le lance.
 */
export async function runDueBilling(now = new Date()): Promise<DueBillingReport> {
	const report: DueBillingReport = { invoicedTenantCount: 0, invoicedGroupCount: 0, failedPaymentCount: 0, abandonedSubscriptionCount: 0, repairedToolAccessCount: 0 };
	for (const subscription of await listSubscriptionsDueForRenewal(now)) {
		let outcome = await renewSubscription(subscription.id, subscription.tenantId, now);
		while (outcome === 'renewed') {
			report.invoicedTenantCount += 1;
			outcome = await renewSubscription(subscription.id, subscription.tenantId, now);
		}
		countFailure(report, outcome);
	}
	for (const subscription of await listSubscriptionsDueForRetry(now)) {
		const outcome = await retryFailedPayment(subscription.id, subscription.tenantId, now);
		if (outcome === 'renewed') report.invoicedTenantCount += 1;
		countFailure(report, outcome);
	}
	for (const contract of await listGroupContractsDue(now)) {
		report.invoicedGroupCount += await billDueGroupContract(contract.groupId, now);
	}
	for (const tenantId of await listTenantIdsWithAccessSources()) {
		const reconciliation = await reconcileToolAccessOfTenant(tenantId, now);
		if (reconciliation.differences.length > 0) report.repairedToolAccessCount += 1;
	}
	return report;
}

/**
 * Facture tout de suite un contrat dont la période est due (activation, première
 * période d'un contrat sur facture). Un contrat par carte activé par la Platform
 * sans paiement n'a pas de carte : sa première facture se règle par virement.
 */
export async function billDueGroupContract(
	groupId: string,
	now = new Date(),
	firstInvoicePaymentMethod?: InvoicePaymentMethod
): Promise<number> {
	let invoicedPeriodCount = 0;
	let isFirstPeriod = true;
	let billedUntil = await readGroupBilledUntil(groupId);
	while (billedUntil && billedUntil <= now) {
		const overview = await getGroupBillingOverview(platformBillingAccess, groupId);
		if (overview.contract?.status !== 'active') break;
		const periodEnd = computePeriodEnd(billedUntil, overview.contract.billingPeriod);
		const invoice = await chargeAndInvoice({
			payer: { groupId },
			lines: describeGroupChargeLines(overview),
			description: 'Contrat de groupement Crystal Pharm',
			periodStart: billedUntil,
			periodEnd,
			paymentMethod:
				(isFirstPeriod ? firstInvoicePaymentMethod : undefined) ??
				(overview.contract.paymentMethod === 'card' ? 'card' : 'transfer')
		});
		isFirstPeriod = false;
		if (invoice) invoicedPeriodCount += 1;
		await runWithBillingAccess(platformBillingAccess, (transaction) =>
			transaction.update(groupContracts).set({ billedUntil: periodEnd }).where(eq(groupContracts.groupId, groupId))
		);
		billedUntil = periodEnd;
	}
	return invoicedPeriodCount;
}

function listGroupContractsDue(now: Date) {
	return runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction
			.select({ groupId: groupContracts.groupId })
			.from(groupContracts)
			.where(and(eq(groupContracts.status, 'active'), lte(groupContracts.billedUntil, now)))
	);
}

function countFailure(report: DueBillingReport, outcome: RenewalOutcome): void {
	if (outcome === 'payment-failed') report.failedPaymentCount += 1;
	if (outcome === 'abandoned') report.abandonedSubscriptionCount += 1;
}

async function readGroupBilledUntil(groupId: string): Promise<Date | undefined> {
	const [contract] = await runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction.select({ billedUntil: groupContracts.billedUntil }).from(groupContracts).where(eq(groupContracts.groupId, groupId))
	);
	return contract?.billedUntil ?? undefined;
}
