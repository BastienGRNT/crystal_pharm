import type { ProtectedTool } from '@crystal-pharm/home/server';
import type { ToolNavigationLink } from '@crystal-pharm/home';
import type { NavigationLink } from '@crystal-pharm/ui';

/** Le menu des outils ; un lien avec `toolKey` n'apparaît qu'aux pharmacies qui ont activé ce module. */
export const toolLinks: readonly ToolNavigationLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house', module: 'accueil' },
	{ label: 'Site', href: '/site-manager', icon: 'globe-simple', module: 'site', toolKey: 'site' },
	{ label: 'Rendez-vous', href: '/booking', icon: 'calendar-check', module: 'rdv', toolKey: 'booking' },
	{ label: 'Ordonnances', href: '/prescriptions', icon: 'prescription', module: 'ordo', toolKey: 'prescriptions' },
	{ label: 'Planning', href: '/planning', icon: 'calendar-dots', module: 'planning', toolKey: 'planning' }
];

/** Les pages de la pharmacie elle-même, qui ne sont pas des modules : au-dessus de l'avatar. */
export const accountLinks: readonly NavigationLink[] = [
	{ label: 'Pharmacie', href: '/pharmacie', icon: 'storefront', module: 'accueil' },
	{ label: 'Abonnement', href: '/abonnement', icon: 'credit-card', module: 'accueil' }
];

/** Les pages (et l'API mobile) de chaque module, fermées tant qu'il n'est pas activé. */
export const protectedTools: readonly ProtectedTool[] = [
	...toolLinks.flatMap((toolLink) => (toolLink.toolKey ? [{ pathnamePrefix: toolLink.href, toolKey: toolLink.toolKey }] : [])),
	{ pathnamePrefix: '/api/v1/planning', toolKey: 'planning' }
];
