import type { NavigationLink } from '@crystal-pharm/ui';

export const adminNavigationLinks: readonly NavigationLink[] = [
	{ label: 'Tableau de bord', href: '/', icon: 'house' },
	{ label: 'Groupements', href: '/groupements', icon: 'buildings' },
	{ label: 'Pharmacies', href: '/pharmacies', icon: 'storefront' },
	{ label: 'Factures', href: '/factures', icon: 'file-text' },
	{ label: 'Catalogue', href: '/catalogue', icon: 'package' }
];
