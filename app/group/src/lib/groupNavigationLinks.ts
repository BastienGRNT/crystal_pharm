import type { NavigationLink } from '@crystal-pharm/ui';

export const groupNavigationLinks: readonly NavigationLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house' },
	{ label: 'Pharmacies', href: '/pharmacies', icon: 'storefront' },
	{ label: 'Contrat', href: '/contrat', icon: 'receipt' },
	{ label: 'Équipe', href: '/equipe', icon: 'users-three' }
];
