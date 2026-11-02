import type { NavigationLink } from '@crystal-pharm/ui';
import { groupPathnames } from './groupPathnames';

/** Quatre entrées : la fiche, le contrat, les factures et l'équipe se rangent en onglets sous « Mon groupement ». */
export const groupNavigationLinks: readonly NavigationLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house' },
	{ label: 'Pharmacies', href: groupPathnames.pharmacies, icon: 'storefront' },
	{ label: 'Actualités', href: '/actualites', icon: 'sparkle' },
	{
		label: 'Mon groupement',
		shortLabel: 'Groupement',
		href: groupPathnames.profile,
		icon: 'buildings',
		alsoCurrentFor: [groupPathnames.contract, groupPathnames.invoices, groupPathnames.team]
	}
];
