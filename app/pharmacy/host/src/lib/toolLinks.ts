import type { NavigationLink } from '@crystal-pharm/ui';

export const toolLinks: readonly NavigationLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house', module: 'accueil' },
	{ label: 'Pharmacie', href: '/pharmacie', icon: 'storefront', module: 'accueil' },
	{ label: 'Site', href: '/site-manager', icon: 'globe-simple', module: 'site' },
	{ label: 'Rendez-vous', href: '/booking', icon: 'calendar-check', module: 'rdv' },
	{ label: 'Ordonnances', href: '/prescriptions', icon: 'prescription', module: 'ordo' },
	{ label: 'Planning', href: '/planning', icon: 'calendar-dots', module: 'planning' }
];
