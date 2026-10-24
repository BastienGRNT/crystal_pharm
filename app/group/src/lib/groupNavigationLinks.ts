import type { NavigationLink } from '@crystal-pharm/ui';

export const groupNavigationLinks: readonly NavigationLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house' },
	{ label: 'Mon groupement', href: '/groupement', icon: 'buildings' },
	{ label: 'Pharmacies', href: '/pharmacies', icon: 'storefront' },
	{ label: 'Contrat', href: '/contrat', icon: 'receipt' },
	{ label: 'Factures', href: '/factures', icon: 'file-text' },
	{ label: 'Équipe', href: '/equipe', icon: 'users-three' }
];
