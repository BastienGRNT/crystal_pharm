import type { SaveResult } from '@crystal-pharm/pharmacy-db/domain';
import { asc, notInArray } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { flatRateOffers } from '../database/billingTables';
import { parseEurosToCents } from '../money/euroAmount';

/** Une offre de la grille : `pharmacyQuota` places pour `monthlyPriceCents` HT par mois. */
export type FlatRateOffer = { offerId: string; label: string; pharmacyQuota: number; monthlyPriceCents: number };

/** Une ligne saisie par la Platform ; sans `offerId`, c'est une nouvelle offre. */
export type FlatRateOfferInput = { offerId: string; label: string; pharmacyQuotaInput: string; priceInput: string };

export function listFlatRateOffers(): Promise<FlatRateOffer[]> {
	return runWithBillingAccess({}, async (transaction) => {
		const offerRows = await transaction.select().from(flatRateOffers).orderBy(asc(flatRateOffers.pharmacyQuota));
		return offerRows.map((offerRow) => ({
			offerId: offerRow.id,
			label: offerRow.label,
			pharmacyQuota: offerRow.pharmacyQuota,
			monthlyPriceCents: offerRow.monthlyPriceCents
		}));
	});
}

/** Remplace la grille : les lignes vides sont ignorées, les offres retirées disparaissent (un contrat garde son prix). */
export async function saveFlatRateOffers(offerInputs: readonly FlatRateOfferInput[]): Promise<SaveResult<string>> {
	const filledInputs = offerInputs.filter((offerInput) => offerInput.label.trim() || offerInput.pharmacyQuotaInput.trim() || offerInput.priceInput.trim());
	const fieldErrors: Record<string, string> = {};
	const offers = filledInputs.map((offerInput, offerIndex) => {
		const pharmacyQuota = Number(offerInput.pharmacyQuotaInput.trim());
		const monthlyPriceCents = parseEurosToCents(offerInput.priceInput);
		if (!offerInput.label.trim() || !Number.isInteger(pharmacyQuota) || pharmacyQuota < 1 || monthlyPriceCents === undefined) {
			fieldErrors[`offer-${offerIndex}`] = 'Chaque offre a un nom, un nombre de places (entier) et un prix en euros.';
		}
		return {
			id: offerInput.offerId || crypto.randomUUID(),
			label: offerInput.label.trim(),
			pharmacyQuota,
			monthlyPriceCents: monthlyPriceCents ?? 0
		};
	});
	if (Object.keys(fieldErrors).length > 0) return { isSaved: false, fieldErrors };

	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const keptOfferIds = offers.map((offer) => offer.id);
		await transaction
			.delete(flatRateOffers)
			.where(keptOfferIds.length > 0 ? notInArray(flatRateOffers.id, keptOfferIds) : undefined);
		for (const offer of offers) {
			await transaction
				.insert(flatRateOffers)
				.values(offer)
				.onConflictDoUpdate({
					target: flatRateOffers.id,
					set: { label: offer.label, pharmacyQuota: offer.pharmacyQuota, monthlyPriceCents: offer.monthlyPriceCents }
				});
		}
	});
	return { isSaved: true };
}
