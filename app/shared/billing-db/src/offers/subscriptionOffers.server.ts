import { and, desc, eq, gt, isNull, or } from 'drizzle-orm';
import { runWithBillingAccess } from '../database/billingDatabase.server';
import { offerVersions, priceAgreements, tenantSubscriptions } from '../database/billingTables';
import { listItemsOfSubscription } from '../events/subscriptionEventSupport.server';
import { readOfferLabels } from './offerCatalog.server';

export type SubscribedOffer = {
	offerKey: string;
	label: string;
	versionNumber: number;
	/** Le prix de la version à laquelle la pharmacie est abonnée. */
	versionPriceCents: number;
	/** Ce qui est facturé : le plus bas du prix de la version et du prix négocié. */
	billedMonthlyPriceCents: number;
	/** Défini quand un prix négocié est ce qui s'applique (la fin de l'accord, vide : à vie). */
	priceAgreement: { endsAt: Date | undefined } | undefined;
	/** Une baisse de prix publiée : le prix de la nouvelle version, appliqué au prochain renouvellement. */
	upcomingVersionPriceCents: number | undefined;
	endsAt: Date | undefined;
};

export type SubscribedOffers = {
	paymentStatus: 'active' | 'past_due';
	nextRetryAt: Date | undefined;
	offers: SubscribedOffer[];
};

/** Les offres de l'abonnement en cours : version, prix appliqué et accord éventuel. */
export function readSubscribedOffers(tenantId: string): Promise<SubscribedOffers | undefined> {
	return runWithBillingAccess({ tenantId }, async (transaction) => {
		const now = new Date();
		const [subscription] = await transaction
			.select()
			.from(tenantSubscriptions)
			.where(and(eq(tenantSubscriptions.tenantId, tenantId), or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, now))))
			.orderBy(desc(tenantSubscriptions.startedAt))
			.limit(1);
		if (!subscription) return undefined;
		const items = await listItemsOfSubscription(transaction, subscription.id);
		const labels = await readOfferLabels(transaction, items.map((item) => item.offerKey));
		const offers: SubscribedOffer[] = [];
		for (const item of items) {
			const [versionRow] = await transaction.select().from(offerVersions).where(eq(offerVersions.id, item.offerVersionId));
			const [upcomingVersionRow] = item.nextOfferVersionId
				? await transaction.select().from(offerVersions).where(eq(offerVersions.id, item.nextOfferVersionId))
				: [];
			const [agreementRow] = item.priceAgreementId
				? await transaction.select().from(priceAgreements).where(eq(priceAgreements.id, item.priceAgreementId))
				: [];
			offers.push({
				offerKey: item.offerKey,
				label: labels.get(item.offerKey) ?? item.offerKey,
				versionNumber: versionRow?.versionNumber ?? 1,
				versionPriceCents: versionRow?.monthlyPriceCents ?? item.billedMonthlyPriceCents,
				billedMonthlyPriceCents: item.billedMonthlyPriceCents,
				priceAgreement: agreementRow && { endsAt: agreementRow.endsAt ?? undefined },
				upcomingVersionPriceCents: upcomingVersionRow?.monthlyPriceCents,
				endsAt: item.endsAt ?? undefined
			});
		}
		return {
			paymentStatus: subscription.status === 'past_due' ? 'past_due' : 'active',
			nextRetryAt: subscription.nextRetryAt ?? undefined,
			offers
		};
	});
}
