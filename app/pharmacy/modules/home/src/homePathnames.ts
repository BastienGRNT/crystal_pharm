export const homePathnames = {
	login: '/login',
	toolsHome: '/',
	contactDetailsStep: '/bienvenue',
	openingHoursStep: '/bienvenue/horaires',
	pharmacy: '/pharmacie',
	pharmacyOpeningHours: '/pharmacie?onglet=horaires',
	pharmacyGroup: '/pharmacie?onglet=groupement',
	subscription: '/abonnement',
	groupInvitation: '/groupement/invitation',
	termsOfSale: '/conditions/generales-de-vente',
	dataProcessingAgreement: '/conditions/traitement-des-donnees'
} as const;

export function invoicePdfPathname(invoiceId: string): string {
	return `${homePathnames.subscription}/factures/${invoiceId}/pdf`;
}

export function subscriptionPathnameHighlighting(toolKey: string): string {
	return `${homePathnames.subscription}?module=${toolKey}#modules`;
}

/** L'invitation vue depuis l'espace : par son lien (le jeton) ou par l'email du compte (son identifiant). */
export function groupInvitationPathname(invitationReference: { invitationToken: string } | { invitationId: string }): string {
	const query =
		'invitationToken' in invitationReference
			? new URLSearchParams({ jeton: invitationReference.invitationToken })
			: new URLSearchParams({ id: invitationReference.invitationId });
	return `${homePathnames.groupInvitation}?${query}`;
}
