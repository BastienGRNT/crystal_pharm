import type { IconName } from './atoms/icons';
import type { ModuleKey } from './modules';

export type ToolLink = {
	label: string;
	href: string;
	icon?: IconName;
	module?: ModuleKey;
};

export const toolLinks: readonly ToolLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house', module: 'accueil' },
	{ label: 'Site', href: '/site-manager', icon: 'globe-simple', module: 'site' },
	{ label: 'Rendez-vous', href: '/booking', icon: 'calendar-check', module: 'rdv' },
	{ label: 'Ordonnances', href: '/prescriptions', icon: 'prescription', module: 'ordo' },
	{ label: 'Planning', href: '/planning', icon: 'calendar-dots', module: 'planning' },
];
