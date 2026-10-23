import { and, eq, isNull, lte, or, gt } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { groupContracts, tenantSubscriptions, type InvoicePaymentMethod } from '../database/billingTables';
import { chargeAndInvoice } from '../invoicing/invoices.server';
import { describeGroupChargeLines, getGroupBillingOverview } from '../overview/groupBilling.server';
import { spreadLinesOverPeriod } from '../pricing/billingPeriodPricing';
import { computePeriodEnd } from '../subscriptions/subscriptionPeriod';
import { describeMonthlyToolLines, getToolAccessOfTenant } from '../subscriptions/tenantSubscriptions.server';

export type DueBillingReport = { invoicedTenantCount: number; invoicedGroupCount: number };

/**
 * Le renouvellement mensuel : chaque abonnement et chaque contrat actif dont la
 * période payée est finie est facturé pour la suivante (prélevé par carte, ou
 * « à régler » par virement). En prod, une tâche planifiée l'appellera chaque
 * jour ; en dev, l'outil de dev le lance.
 */
export async function runDueBilling(now = new Date()): Promise<DueBillingReport> {
	const report: DueBillingReport = { invoicedTenantCount: 0, invoicedGroupCount: 0 };
	for (const subscription of await listSubscriptionsDue(now)) {
		report.invoicedTenantCount += await billDueSubscription(subscription.id, subscription.tenantId, now);
	}
	for (const contract of await listGroupContractsDue(now)) {
		report.invoicedGroupCount += await billDueGroupContract(contract.groupId, now);
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

async function billDueSubscription(subscriptionId: string, tenantId: string, now: Date): Promise<number> {
	let invoicedPeriodCount = 0;
	let toolAccess = await getToolAccessOfTenant(tenantId, now);
	while (toolAccess.subscription?.subscriptionId === subscriptionId && toolAccess.subscription.currentPeriodEndsAt <= now) {
		const subscription = toolAccess.subscription;
		const periodStart = subscription.currentPeriodEndsAt;
		const billingPeriod = subscription.nextBillingPeriod ?? subscription.billingPeriod;
		const periodEnd = computePeriodEnd(periodStart, billingPeriod);
		const continuingToolKeys = subscription.tools
			.filter((subscribedTool) => !subscribedTool.endsAt)
			.map((subscribedTool) => subscribedTool.toolKey);
		const invoice = await chargeAndInvoice({
			payer: { tenantId },
			lines: spreadLinesOverPeriod(
				describeMonthlyToolLines(toolAccess.quote, continuingToolKeys),
				billingPeriod,
				toolAccess.catalog.annualFreeMonths
			),
			description: 'Abonnement Crystal Pharm',
			periodStart,
			periodEnd,
			paymentMethod: 'card'
		});
		if (invoice) invoicedPeriodCount += 1;
		await runWithBillingAccess(platformBillingAccess, (transaction) =>
			transaction
				.update(tenantSubscriptions)
				.set({ billedUntil: periodEnd, billingPeriod, nextBillingPeriod: null })
				.where(eq(tenantSubscriptions.id, subscriptionId))
		);
		toolAccess = await getToolAccessOfTenant(tenantId, now);
	}
	return invoicedPeriodCount;
}

function listSubscriptionsDue(now: Date) {
	return runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction
			.select({ id: tenantSubscriptions.id, tenantId: tenantSubscriptions.tenantId })
			.from(tenantSubscriptions)
			.where(
				and(
					lte(tenantSubscriptions.billedUntil, now),
					or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, tenantSubscriptions.billedUntil))
				)
			)
	);
}

function listGroupContractsDue(now: Date) {
	return runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction
			.select({ groupId: groupContracts.groupId })
			.from(groupContracts)
			.where(and(eq(groupContracts.status, 'active'), lte(groupContracts.billedUntil, now)))
	);
}

async function readGroupBilledUntil(groupId: string): Promise<Date | undefined> {
	const [contract] = await runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction.select({ billedUntil: groupContracts.billedUntil }).from(groupContracts).where(eq(groupContracts.groupId, groupId))
	);
	return contract?.billedUntil ?? undefined;
}
