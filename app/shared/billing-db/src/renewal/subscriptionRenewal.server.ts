import { and, eq, gt, isNull, lte, or } from 'drizzle-orm';
import { readToolCatalog } from '../catalog/toolCatalog.server';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { offerVersions, payments, tenantSubscriptionItems, tenantSubscriptions } from '../database/billingTables';
import {
	computeBilledPriceOfOffer,
	finishSubscriptionEvent,
	listItemsOfSubscription,
	type SubscriptionItemWithOffer,
	type SubscriptionRow
} from '../events/subscriptionEventSupport.server';
import { chargeAndInvoiceInTransaction, describeInvoiceCustomer, type InvoiceCustomer } from '../invoicing/invoices.server';
import { addVat } from '../invoicing/vatAmounts';
import { readOfferLabels } from '../offers/offerCatalog.server';
import { getPaymentProvider } from '../payments/paymentProvider';
import { spreadLinesOverPeriod } from '../pricing/billingPeriodPricing';
import { planNextPaymentRetry } from '../subscriptions/paymentRetrySchedule';
import { computePeriodEnd } from '../subscriptions/subscriptionPeriod';

/** `renewed` : période suivante payée · `payment-failed` : on relancera · `abandoned` : relances épuisées · `skipped` : déjà pris par une autre instance, ou plus dû. */
export type RenewalOutcome = 'renewed' | 'payment-failed' | 'abandoned' | 'skipped';

type RenewedItem = { item: SubscriptionItemWithOffer; offerVersionId: string; billedMonthlyPriceCents: number; priceAgreementId: string | null };

/**
 * Événement : la période payée d'un abonnement actif est finie. Le prélèvement
 * se tente ; réussi, la période suivante commence ; raté, rien ne change dans
 * les accès (la grâce de 7 jours les garde ouverts) et une relance est planifiée.
 */
export async function renewSubscription(subscriptionId: string, tenantId: string, now: Date): Promise<RenewalOutcome> {
	const customer = await describeInvoiceCustomer({ tenantId });
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const [subscription] = await transaction
			.select()
			.from(tenantSubscriptions)
			.where(
				and(
					eq(tenantSubscriptions.id, subscriptionId),
					eq(tenantSubscriptions.status, 'active'),
					lte(tenantSubscriptions.billedUntil, now),
					or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, tenantSubscriptions.billedUntil))
				)
			)
			.for('update', { skipLocked: true });
		if (!subscription) return 'skipped';
		return chargePeriod(transaction, subscription, customer, 1, now);
	});
}

/**
 * Événement : une relance après un paiement raté (J+1, J+3, J+6). Réussie,
 * l'abonnement redevient actif et avance d'une période à partir de l'ancienne
 * échéance ; ratée, la suivante est planifiée, ou l'abonnement s'arrête.
 */
export async function retryFailedPayment(subscriptionId: string, tenantId: string, now: Date): Promise<RenewalOutcome> {
	const customer = await describeInvoiceCustomer({ tenantId });
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const [subscription] = await transaction
			.select()
			.from(tenantSubscriptions)
			.where(
				and(
					eq(tenantSubscriptions.id, subscriptionId),
					eq(tenantSubscriptions.status, 'past_due'),
					lte(tenantSubscriptions.nextRetryAt, now)
				)
			)
			.for('update', { skipLocked: true });
		if (!subscription) return 'skipped';
		return chargePeriod(transaction, subscription, customer, subscription.failedAttempts + 1, now);
	});
}

export function listSubscriptionsDueForRenewal(now: Date) {
	return runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction
			.select({ id: tenantSubscriptions.id, tenantId: tenantSubscriptions.tenantId })
			.from(tenantSubscriptions)
			.where(
				and(
					eq(tenantSubscriptions.status, 'active'),
					lte(tenantSubscriptions.billedUntil, now),
					or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, tenantSubscriptions.billedUntil))
				)
			)
	);
}

export function listSubscriptionsDueForRetry(now: Date) {
	return runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction
			.select({ id: tenantSubscriptions.id, tenantId: tenantSubscriptions.tenantId })
			.from(tenantSubscriptions)
			.where(and(eq(tenantSubscriptions.status, 'past_due'), lte(tenantSubscriptions.nextRetryAt, now)))
	);
}

async function chargePeriod(
	transaction: BillingTransaction,
	subscription: SubscriptionRow,
	customer: InvoiceCustomer,
	attemptNumber: number,
	now: Date
): Promise<RenewalOutcome> {
	const periodStart = subscription.billedUntil;
	const billingPeriod = subscription.nextBillingPeriod ?? subscription.billingPeriod;
	const periodEnd = computePeriodEnd(periodStart, billingPeriod);
	const renewedItems = await priceItemsForRenewal(transaction, subscription);
	const lines = await describeRenewalLines(transaction, renewedItems, billingPeriod);
	const subtotalCents = lines.reduce((total, line) => total + line.amountCents, 0);

	if (subtotalCents > 0) {
		const idempotencyKey = `${subscription.id}:${periodStart.toISOString()}:${attemptNumber}`;
		const chargeResult = await getPaymentProvider().chargeStoredCard({
			cardReference: subscription.providerSubscriptionReference,
			amountCents: addVat(subtotalCents).totalCents,
			idempotencyKey
		});
		if (chargeResult.outcome === 'declined') {
			await transaction.insert(payments).values({
				id: crypto.randomUUID(),
				tenantId: subscription.tenantId,
				subscriptionId: subscription.id,
				attemptNumber,
				amountCents: addVat(subtotalCents).totalCents,
				description: 'Abonnement Crystal Pharm',
				status: 'failed',
				providerPaymentReference: chargeResult.providerPaymentReference,
				paidAt: now
			});
			return recordPaymentFailure(transaction, subscription, attemptNumber, now);
		}
		await chargeAndInvoiceInTransaction(
			transaction,
			{
				payer: { tenantId: subscription.tenantId },
				lines,
				description: 'Abonnement Crystal Pharm',
				periodStart,
				periodEnd,
				paymentMethod: 'card',
				storedCardPayment: { subscriptionId: subscription.id, attemptNumber, providerPaymentReference: chargeResult.providerPaymentReference }
			},
			customer
		);
	}

	for (const renewedItem of renewedItems) {
		await transaction
			.update(tenantSubscriptionItems)
			.set({
				offerVersionId: renewedItem.offerVersionId,
				nextOfferVersionId: null,
				billedMonthlyPriceCents: renewedItem.billedMonthlyPriceCents,
				priceAgreementId: renewedItem.priceAgreementId
			})
			.where(eq(tenantSubscriptionItems.id, renewedItem.item.id));
	}
	await transaction
		.update(tenantSubscriptions)
		.set({
			billedUntil: periodEnd,
			billingPeriod,
			nextBillingPeriod: null,
			status: 'active',
			failedAttempts: 0,
			firstFailedAt: null,
			nextRetryAt: null
		})
		.where(eq(tenantSubscriptions.id, subscription.id));
	await finishSubscriptionEvent(transaction, subscription.tenantId, now, subscription.id);
	return 'renewed';
}

/** Les lignes qui restent pour la période suivante (une ligne retirée s'arrête là), à leur version et leur prix de demain. */
async function priceItemsForRenewal(transaction: BillingTransaction, subscription: SubscriptionRow): Promise<RenewedItem[]> {
	const continuingItems = (await listItemsOfSubscription(transaction, subscription.id)).filter(
		(item) => !item.endsAt || item.endsAt > subscription.billedUntil
	);
	const renewedItems: RenewedItem[] = [];
	for (const item of continuingItems) {
		const offerVersionId = item.nextOfferVersionId ?? item.offerVersionId;
		const [versionRow] = await transaction.select().from(offerVersions).where(eq(offerVersions.id, offerVersionId));
		if (!versionRow) continue;
		const pricing = await computeBilledPriceOfOffer(transaction, subscription.tenantId, item.offerKey, versionRow.monthlyPriceCents, subscription.billedUntil);
		renewedItems.push({ item, offerVersionId, ...pricing });
	}
	return renewedItems;
}

async function describeRenewalLines(transaction: BillingTransaction, renewedItems: readonly RenewedItem[], billingPeriod: 'monthly' | 'yearly') {
	const labels = await readOfferLabels(transaction, renewedItems.map((renewedItem) => renewedItem.item.offerKey));
	const monthlyLines = renewedItems
		.filter((renewedItem) => renewedItem.billedMonthlyPriceCents > 0)
		.map((renewedItem) => ({
			label: `Offre ${labels.get(renewedItem.item.offerKey) ?? renewedItem.item.offerKey}`,
			amountCents: renewedItem.billedMonthlyPriceCents
		}));
	const { annualFreeMonths } = await readToolCatalog(transaction);
	return spreadLinesOverPeriod(monthlyLines, billingPeriod, annualFreeMonths);
}

/** Un prélèvement a raté : l'abonnement passe en retard avec sa prochaine relance, ou s'arrête quand elles sont épuisées. Aucun accès n'est touché avant le dernier cas. */
async function recordPaymentFailure(
	transaction: BillingTransaction,
	subscription: SubscriptionRow,
	failedAttemptCount: number,
	now: Date
): Promise<RenewalOutcome> {
	const firstFailedAt = subscription.firstFailedAt ?? now;
	const retryPlan = planNextPaymentRetry(firstFailedAt, failedAttemptCount);
	if (retryPlan.outcome === 'retry') {
		await transaction
			.update(tenantSubscriptions)
			.set({ status: 'past_due', failedAttempts: failedAttemptCount, firstFailedAt, nextRetryAt: retryPlan.nextRetryAt })
			.where(eq(tenantSubscriptions.id, subscription.id));
		return 'payment-failed';
	}
	await transaction
		.update(tenantSubscriptions)
		.set({ status: 'ended', failedAttempts: failedAttemptCount, nextRetryAt: null, cancelledAt: now, endsAt: subscription.billedUntil })
		.where(eq(tenantSubscriptions.id, subscription.id));
	await finishSubscriptionEvent(transaction, subscription.tenantId, now, subscription.id);
	return 'abandoned';
}
