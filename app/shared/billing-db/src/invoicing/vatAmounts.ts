/** Les prix du catalogue sont hors taxes (vente entre professionnels) : la TVA s'ajoute sur la facture. */
export const vatRatePercent = 20;

export type AmountsWithVat = { subtotalCents: number; vatCents: number; totalCents: number };

export function addVat(subtotalCents: number): AmountsWithVat {
	const vatCents = Math.round((subtotalCents * vatRatePercent) / 100);
	return { subtotalCents, vatCents, totalCents: subtotalCents + vatCents };
}
