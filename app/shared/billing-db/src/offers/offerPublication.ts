import type { ToolKey } from '../tools/tools';

export type OfferVersionTerms = { monthlyPriceCents: number; toolKeys: readonly ToolKey[] };

/**
 * Une baisse de prix est une nouvelle version de la même offre qui garde au
 * moins les mêmes Tools pour un prix plus bas : seule celle-là suit les
 * abonnés. Tout autre changement ne touche que les nouveaux abonnements.
 */
export function isPriceDrop(previousVersion: OfferVersionTerms, nextVersion: OfferVersionTerms): boolean {
	const keepsEveryTool = previousVersion.toolKeys.every((toolKey) => nextVersion.toolKeys.includes(toolKey));
	return keepsEveryTool && nextVersion.monthlyPriceCents < previousVersion.monthlyPriceCents;
}
