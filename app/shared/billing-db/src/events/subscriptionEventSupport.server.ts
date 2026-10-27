import { readCoveringGroupOfTenant } from '@crystal-pharm/group-db';
import { and, desc, eq, gt, isNull, lte, or } from 'drizzle-orm';
import { rebuildToolAccessOfTenant } from '../access/rebuildToolAccessOfTenant.server';
import type { BillingTransaction } from '../database/billingDatabase.server';
import {
	offerVersions,
	priceAgreements,
	tenantSubscriptionItems,
	tenantSubscriptions
} from '../database/billingTables';
import { computeBilledPriceCents, pickLowestAgreementPriceCents } from '../pricing/negotiatedPrice';

export type SubscriptionRow = typeof tenantSubscriptions.$inferSelect;
export type SubscriptionItemWithOffer = typeof tenantSubscriptionItems.$inferSelect & { offerKey: string };

/** L'abonnement en cours du Tenant (pas terminé), verrouillé jusqu'à la fin de la transaction. */
export async function lockCurrentSubscriptionOfTenant(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date
): Promise<SubscriptionRow | undefined> {
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
		.limit(1)
		.for('update');
	return subscriptionRow;
}

export async function listItemsOfSubscription(
	transaction: BillingTransaction,
	subscriptionId: string
): Promise<SubscriptionItemWithOffer[]> {
	const itemRows = await transaction
		.select({ item: tenantSubscriptionItems, offerKey: offerVersions.offerKey })
		.from(tenantSubscriptionItems)
		.innerJoin(offerVersions, eq(offerVersions.id, tenantSubscriptionItems.offerVersionId))
		.where(eq(tenantSubscriptionItems.subscriptionId, subscriptionId));
	return itemRows.map((itemRow) => ({ ...itemRow.item, offerKey: itemRow.offerKey }));
}

/**
 * Le prix négocié qui s'applique à une offre à une date : le plus bas entre
 * l'accord du Tenant et celui de son groupement.
 */
export async function findPriceAgreementInForce(
	transaction: BillingTransaction,
	tenantId: string,
	offerKey: string,
	at: Date
): Promise<{ priceAgreementId: string; monthlyPriceCents: number } | undefined> {
	const coveringGroup = await readCoveringGroupOfTenant(transaction, tenantId, at);
	const beneficiaryCondition = coveringGroup
		? or(eq(priceAgreements.tenantId, tenantId), eq(priceAgreements.groupId, coveringGroup.groupId))
		: eq(priceAgreements.tenantId, tenantId);
	const agreementRows = await transaction
		.select()
		.from(priceAgreements)
		.where(
			and(
				eq(priceAgreements.offerKey, offerKey),
				beneficiaryCondition,
				lte(priceAgreements.startsAt, at),
				or(isNull(priceAgreements.endsAt), gt(priceAgreements.endsAt, at))
			)
		);
	const lowestPriceCents = pickLowestAgreementPriceCents(agreementRows.map((agreementRow) => agreementRow.monthlyPriceCents));
	const lowestAgreementRow = agreementRows.find((agreementRow) => agreementRow.monthlyPriceCents === lowestPriceCents);
	return lowestAgreementRow && { priceAgreementId: lowestAgreementRow.id, monthlyPriceCents: lowestAgreementRow.monthlyPriceCents };
}

/** Le prix facturé d'une offre à une version, à une date : à écrire sur la ligne d'abonnement. */
export async function computeBilledPriceOfOffer(
	transaction: BillingTransaction,
	tenantId: string,
	offerKey: string,
	offerVersionPriceCents: number,
	at: Date
): Promise<{ billedMonthlyPriceCents: number; priceAgreementId: string | null }> {
	const agreement = await findPriceAgreementInForce(transaction, tenantId, offerKey, at);
	const billedMonthlyPriceCents = computeBilledPriceCents({
		offerVersionPriceCents,
		priceAgreementPriceCents: agreement?.monthlyPriceCents
	});
	const isAgreementApplied = agreement !== undefined && agreement.monthlyPriceCents < offerVersionPriceCents;
	return { billedMonthlyPriceCents, priceAgreementId: isAgreementApplied ? agreement.priceAgreementId : null };
}

/**
 * Recalcule le prix facturé des lignes en cours, pour le prochain
 * renouvellement : un accord qui commence, change ou se termine joue ici.
 */
export async function repriceItemsOfSubscription(
	transaction: BillingTransaction,
	subscription: SubscriptionRow
): Promise<void> {
	const renewalDate = new Date(Math.max(subscription.billedUntil.getTime(), Date.now()));
	for (const item of await listItemsOfSubscription(transaction, subscription.id)) {
		if (item.endsAt) continue;
		const versionId = item.nextOfferVersionId ?? item.offerVersionId;
		const [versionRow] = await transaction.select().from(offerVersions).where(eq(offerVersions.id, versionId));
		if (!versionRow) continue;
		const pricing = await computeBilledPriceOfOffer(transaction, subscription.tenantId, item.offerKey, versionRow.monthlyPriceCents, renewalDate);
		await transaction.update(tenantSubscriptionItems).set(pricing).where(eq(tenantSubscriptionItems.id, item.id));
	}
}

/** La fin de chaque événement : la projection des accès est refaite, dans la même transaction. */
export async function finishSubscriptionEvent(transaction: BillingTransaction, tenantId: string, now: Date): Promise<void> {
	await rebuildToolAccessOfTenant(transaction, tenantId, now);
}
