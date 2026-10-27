/** Un prix négocié est un plafond : jamais plus cher que la version, jamais une hausse. */
export type BilledPriceRequest = {
	offerVersionPriceCents: number;
	priceAgreementPriceCents: number | undefined;
};

/** La seule règle du prix facturé, écrite sur la ligne d'abonnement au moment où elle se crée ou change. */
export function computeBilledPriceCents({ offerVersionPriceCents, priceAgreementPriceCents }: BilledPriceRequest): number {
	if (priceAgreementPriceCents === undefined) return offerVersionPriceCents;
	return Math.min(offerVersionPriceCents, priceAgreementPriceCents);
}

export type PriceAgreementWindow = { startsAt: Date; endsAt: Date | undefined };

/** Un accord sans date de fin vaut à vie. */
export function isPriceAgreementInForce(agreement: PriceAgreementWindow, now: Date): boolean {
	return agreement.startsAt <= now && (agreement.endsAt === undefined || agreement.endsAt > now);
}

/** Entre l'accord de la pharmacie et celui de son groupement, c'est le prix le plus bas qui s'applique. */
export function pickLowestAgreementPriceCents(agreementPricesCents: readonly number[]): number | undefined {
	return agreementPricesCents.length === 0 ? undefined : Math.min(...agreementPricesCents);
}
