import type { AccessPanel } from './pages/pharmacy/pharmacyPageData';

export const homePathnames = {
	login: '/login',
	toolsHome: '/',
	contactDetailsStep: '/bienvenue',
	openingHoursStep: '/bienvenue/horaires',
	pharmacy: '/pharmacie',
	pharmacyOpeningHours: '/pharmacie?onglet=horaires',
	pharmacyTeam: '/pharmacie?onglet=equipe',
	pharmacyGroup: '/pharmacie?onglet=groupement',
	pharmacyAccess: '/pharmacie?onglet=acces',
	subscription: '/abonnement',
	groupInvitation: '/groupement/invitation',
	termsOfSale: '/conditions/generales-de-vente',
	dataProcessingAgreement: '/conditions/traitement-des-donnees'
} as const;

/** Le panneau d'un membre de l'équipe : `undefined` pour en ajouter un. */
export function employeePanelPathname(employeeId: string | undefined): string {
	return `${homePathnames.pharmacyTeam}&membre=${employeeId ?? 'nouveau'}`;
}

/** Le panneau des comptes et accès : une invitation, le compte comptoir, ou un compte. */
export function accessPanelPathname(panel: AccessPanel): string {
	const panelValue = panel.kind === 'invitation' ? 'invitation' : panel.kind === 'counter-account' ? 'comptoir' : panel.accountId;
	return `${homePathnames.pharmacyAccess}&compte=${panelValue}`;
}

/** Le lien de l'email d'invitation d'un Employee : il y crée son compte. */
export function teamInvitationPathname(invitationToken: string): string {
	return `/rejoindre/${invitationToken}`;
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
