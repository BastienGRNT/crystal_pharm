export const homePathnames = {
	login: '/login',
	toolsHome: '/',
	contactDetailsStep: '/bienvenue',
	openingHoursStep: '/bienvenue/horaires',
	pharmacy: '/pharmacie',
	pharmacyOpeningHours: '/pharmacie?onglet=horaires',
	pharmacyTeam: '/pharmacie?onglet=equipe',
	pharmacyGroup: '/pharmacie?onglet=groupement',
	subscription: '/abonnement',
	groupInvitation: '/groupement/invitation',
	termsOfSale: '/conditions/generales-de-vente',
	dataProcessingAgreement: '/conditions/traitement-des-donnees'
} as const;

/** Le panneau d'un membre de l'équipe : `undefined` pour en ajouter un. */
export function employeePanelPathname(employeeId: string | undefined): string {
	return `${homePathnames.pharmacyTeam}&membre=${employeeId ?? 'nouveau'}`;
}

export function employeePhotoPathname(photoId: string): string {
	return `${homePathnames.pharmacy}/equipe/photos/${photoId}`;
}

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
