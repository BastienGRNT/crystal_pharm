export const groupPathnames = {
	withoutGroup: '/sans-groupement',
	pharmacies: '/pharmacies',
	invitePharmacies: '/pharmacies?panneau=inviter',
	contract: '/contrat',
	invoices: '/factures',
	profile: '/groupement'
} as const;

export function invoicePdfPathname(invoiceId: string): string {
	return `${groupPathnames.invoices}/${invoiceId}/pdf`;
}

/** Une image remplacée change d'identifiant, donc d'adresse : celle-ci se garde en cache. */
export function pharmacyGroupImagePathname(imageId: string): string {
	return `${groupPathnames.profile}/images/${imageId}`;
}
