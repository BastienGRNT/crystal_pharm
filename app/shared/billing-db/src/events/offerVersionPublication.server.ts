import { sendEmail } from '@crystal-pharm/email';
import { listOwnerEmailsOfTenant } from '@crystal-pharm/pharmacy-db';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { offers, offerVersions, offerVersionTools, tenantSubscriptionItems, tenantSubscriptions } from '../database/billingTables';
import { readOfferVersion } from '../offers/offerCatalog.server';
import { isPriceDrop, type OfferVersionTerms } from '../offers/offerPublication';
import {
	finishSubscriptionEvent,
	lockCurrentSubscriptionOfTenant,
	repriceItemsOfSubscription
} from './subscriptionEventSupport.server';

export type OfferVersionPublication = {
	offerKey: string;
	label: string;
	monthlyPriceCents: number;
	toolKeys: OfferVersionTerms['toolKeys'];
};

export type PublishedOfferVersion = { offerVersionId: string; versionNumber: number; switchedTenantIds: string[] };

/**
 * Événement : la Platform publie une version d'une offre. Une version n'est
 * jamais modifiée ; si c'est une baisse de prix, les lignes des abonnés
 * passent à la nouvelle version au prochain renouvellement (jamais une hausse).
 */
export async function publishOfferVersion(publication: OfferVersionPublication, now: Date): Promise<PublishedOfferVersion> {
	const published = await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		await transaction
			.insert(offers)
			.values({ offerKey: publication.offerKey, label: publication.label })
			.onConflictDoUpdate({ target: offers.offerKey, set: { label: publication.label } });
		const [latestVersionRow] = await transaction
			.select()
			.from(offerVersions)
			.where(eq(offerVersions.offerKey, publication.offerKey))
			.orderBy(desc(offerVersions.versionNumber))
			.limit(1);
		const previousVersion = latestVersionRow && (await readOfferVersion(transaction, latestVersionRow.id));

		const offerVersionId = crypto.randomUUID();
		const versionNumber = (latestVersionRow?.versionNumber ?? 0) + 1;
		await transaction.insert(offerVersions).values({
			id: offerVersionId,
			offerKey: publication.offerKey,
			versionNumber,
			monthlyPriceCents: publication.monthlyPriceCents,
			publishedAt: now
		});
		if (publication.toolKeys.length > 0) {
			await transaction
				.insert(offerVersionTools)
				.values(publication.toolKeys.map((toolKey) => ({ offerVersionId, toolKey })));
		}

		const switchedTenantIds: string[] = [];
		if (previousVersion && isPriceDrop(previousVersion, publication)) {
			const olderVersionIds = (
				await transaction.select({ id: offerVersions.id }).from(offerVersions).where(eq(offerVersions.offerKey, publication.offerKey))
			)
				.map((versionRow) => versionRow.id)
				.filter((versionId) => versionId !== offerVersionId);
			const concernedItems = await transaction
				.select({ tenantId: tenantSubscriptions.tenantId })
				.from(tenantSubscriptionItems)
				.innerJoin(tenantSubscriptions, eq(tenantSubscriptions.id, tenantSubscriptionItems.subscriptionId))
				.where(
					and(
						inArray(tenantSubscriptionItems.offerVersionId, olderVersionIds),
						isNull(tenantSubscriptionItems.endsAt),
						isNull(tenantSubscriptionItems.nextOfferVersionId)
					)
				);
			for (const tenantId of new Set(concernedItems.map((concernedItem) => concernedItem.tenantId))) {
				const subscription = await lockCurrentSubscriptionOfTenant(transaction, tenantId, now);
				if (!subscription) continue;
				await transaction
					.update(tenantSubscriptionItems)
					.set({ nextOfferVersionId: offerVersionId })
					.where(
						and(
							eq(tenantSubscriptionItems.subscriptionId, subscription.id),
							inArray(tenantSubscriptionItems.offerVersionId, olderVersionIds),
							isNull(tenantSubscriptionItems.endsAt)
						)
					);
				await repriceItemsOfSubscription(transaction, subscription);
				await finishSubscriptionEvent(transaction, tenantId, now);
				switchedTenantIds.push(tenantId);
			}
		}
		return { offerVersionId, versionNumber, switchedTenantIds };
	});
	await notifyPriceDrop(published.switchedTenantIds, publication);
	return published;
}

/** Hors de la transaction : un email qui échoue ne défait pas la publication. */
async function notifyPriceDrop(tenantIds: readonly string[], publication: OfferVersionPublication): Promise<void> {
	const newPrice = (publication.monthlyPriceCents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
	for (const tenantId of tenantIds) {
		for (const ownerEmail of await listOwnerEmailsOfTenant(tenantId)) {
			await sendEmail({
				to: ownerEmail,
				subject: `Bonne nouvelle : l'offre ${publication.label} baisse de prix`,
				text: `Le prix de l'offre ${publication.label} passe à ${newPrice} € HT par mois. Il s'appliquera dès votre prochain renouvellement, sans rien à faire.`,
				actionLinks: []
			});
		}
	}
}
