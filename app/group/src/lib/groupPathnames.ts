export const groupPathnames = {
	login: '/login',
	home: '/',
	withoutGroup: '/sans-groupement',
	pharmacies: '/pharmacies',
	invitePharmacies: '/pharmacies?panneau=inviter',
	contract: '/contrat',
	invoices: '/factures',
	team: '/equipe'
} as const;

export function invoicePdfPathname(invoiceId: string): string {
	return `${groupPathnames.invoices}/${invoiceId}/pdf`;
}
