/**
 * Les droits qu'un Owner accorde à un TenantMember, écrits une seule fois. L'abonnement
 * et la gestion des accès n'en font pas partie : ils sont réservés aux Owners.
 */
export const responsibilities = [
	{
		responsibilityKey: 'manage-team-planning',
		label: 'Planning de l’équipe',
		description: 'Organiser le planning de toute l’équipe et valider les congés.'
	},
	{
		responsibilityKey: 'handle-appointments',
		label: 'Rendez-vous',
		description: 'Voir, confirmer et annuler les rendez-vous des patients.'
	},
	{
		responsibilityKey: 'handle-prescriptions',
		label: 'Ordonnances',
		description: 'Consulter et traiter les ordonnances envoyées depuis le site.'
	},
	{
		responsibilityKey: 'edit-site',
		label: 'Site',
		description: 'Modifier le site public de la pharmacie.'
	},
	{
		responsibilityKey: 'edit-pharmacy-profile',
		label: 'Fiche de la pharmacie',
		description: 'Modifier les coordonnées, les horaires et l’équipe affichés.'
	}
] as const;

export type ResponsibilityKey = (typeof responsibilities)[number]['responsibilityKey'];

export const responsibilityKeys: readonly ResponsibilityKey[] = responsibilities.map(
	({ responsibilityKey }) => responsibilityKey
);

export function isResponsibilityKey(candidate: string): candidate is ResponsibilityKey {
	return (responsibilityKeys as readonly string[]).includes(candidate);
}

/** Les clés connues, sans doublon, dans l'ordre de la liste : une saisie inconnue est ignorée. */
export function keepKnownResponsibilityKeys(candidates: readonly string[]): ResponsibilityKey[] {
	return responsibilityKeys.filter((responsibilityKey) => candidates.includes(responsibilityKey));
}
