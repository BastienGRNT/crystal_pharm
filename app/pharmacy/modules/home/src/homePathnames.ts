export const homePathnames = {
	login: '/login',
	toolsHome: '/',
	contactDetailsStep: '/bienvenue',
	openingHoursStep: '/bienvenue/horaires',
	pharmacy: '/pharmacie',
	pharmacyOpeningHours: '/pharmacie#horaires',
	pharmacyGroup: '/pharmacie#groupement',
	subscription: '/abonnement',
	groupInvitation: '/groupement/invitation'
} as const;

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
