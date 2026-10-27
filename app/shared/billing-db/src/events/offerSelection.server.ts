import { and, eq } from 'drizzle-orm';
import type { BillingTransaction } from '../database/billingDatabase.server';
import { tenantSubscriptionItems, tenantSubscriptions, type BillingPeriod } from '../database/billingTables';
import { readLatestOfferVersion } from '../offers/offerCatalog.server';
import { computePeriodEnd } from '../subscriptions/subscriptionPeriod';
import {
	computeBilledPriceOfOffer,
	finishSubscriptionEvent,
	listItemsOfSubscription,
	lockCurrentSubscriptionOfTenant,
	repriceItemsOfSubscription,
	type SubscriptionRow
} from './subscriptionEventSupport.server';

/**
 * Événement : la pharmacie a payé ce qu'il fallait (ou rien n'était dû) et son
 * abonnement prend exactement ces offres, à leur dernière version, sur cette
 * période. Une offre nouvelle devient une ligne ; une offre qui n'est plus
 * voulue s'arrête à la fin de la période payée ; une offre déjà là ne bouge pas
 * (elle garde sa version). Changer d'offre, c'est en retirer une et en prendre une autre.
 */
export async function selectOffersOfSubscription(
	transaction: BillingTransaction,
	tenantId: string,
	desiredOfferKeys: readonly string[],
	requestedBillingPeriod: BillingPeriod,
	now: Date
): Promise<void> {
	const subscription =
		(await lockCurrentSubscriptionOfTenant(transaction, tenantId, now)) ??
		(await startSubscription(transaction, tenantId, requestedBillingPeriod, now));
	if (subscription.endsAt) await clearCancellation(transaction, subscription.id);
	await transaction
		.update(tenantSubscriptions)
		.set({ nextBillingPeriod: requestedBillingPeriod === subscription.billingPeriod ? null : requestedBillingPeriod })
		.where(eq(tenantSubscriptions.id, subscription.id));

	const items = await listItemsOfSubscription(transaction, subscription.id);
	for (const offerKey of desiredOfferKeys) {
		const pendingRemoval = items.find((item) => item.offerKey === offerKey && item.endsAt && item.endsAt > now);
		const isAlreadySubscribed = items.some((item) => item.offerKey === offerKey && !item.endsAt);
		if (isAlreadySubscribed) continue;
		if (pendingRemoval) {
			await transaction.update(tenantSubscriptionItems).set({ endsAt: null }).where(eq(tenantSubscriptionItems.id, pendingRemoval.id));
			continue;
		}
		await addItem(transaction, subscription, offerKey, now);
	}
	for (const item of items) {
		if (item.endsAt || desiredOfferKeys.includes(item.offerKey)) continue;
		await transaction
			.update(tenantSubscriptionItems)
			.set({ endsAt: subscription.billedUntil })
			.where(eq(tenantSubscriptionItems.id, item.id));
	}
	await repriceItemsOfSubscription(transaction, subscription);
	await finishSubscriptionEvent(transaction, tenantId, now);
}

async function addItem(transaction: BillingTransaction, subscription: SubscriptionRow, offerKey: string, now: Date): Promise<void> {
	const offer = await readLatestOfferVersion(transaction, offerKey);
	if (!offer) throw new Error(`The offer ${offerKey} does not exist.`);
	const pricing = await computeBilledPriceOfOffer(transaction, subscription.tenantId, offerKey, offer.monthlyPriceCents, now);
	await transaction.insert(tenantSubscriptionItems).values({
		id: crypto.randomUUID(),
		tenantId: subscription.tenantId,
		subscriptionId: subscription.id,
		offerVersionId: offer.offerVersionId,
		startedAt: now,
		...pricing
	});
}

async function startSubscription(
	transaction: BillingTransaction,
	tenantId: string,
	billingPeriod: BillingPeriod,
	now: Date
): Promise<SubscriptionRow> {
	const [subscriptionRow] = await transaction
		.insert(tenantSubscriptions)
		.values({ id: crypto.randomUUID(), tenantId, startedAt: now, billedUntil: computePeriodEnd(now, billingPeriod), billingPeriod })
		.returning();
	if (!subscriptionRow) throw new Error('The subscription could not be created.');
	return subscriptionRow;
}

async function clearCancellation(transaction: BillingTransaction, subscriptionId: string): Promise<void> {
	await transaction
		.update(tenantSubscriptions)
		.set({ cancelledAt: null, endsAt: null })
		.where(and(eq(tenantSubscriptions.id, subscriptionId), eq(tenantSubscriptions.status, 'active')));
}
