import type { NavigationSection } from '@crystal-pharm/ui';

export const toolNavigationSections: readonly NavigationSection[] = [
	{
		links: [{ label: 'Accueil', href: '/', icon: 'house' }]
	},
	{
		label: 'Gestion',
		links: [
			{ label: 'Planning', href: '/planning', icon: 'calendar-dots', module: 'planning' },
			{ label: 'Rendez-vous', href: '/booking', icon: 'calendar-check' },
			{ label: 'Ordonnances', href: '/prescriptions', icon: 'prescription' },
			{ label: 'Mon site', href: '/site-manager', icon: 'globe-simple', module: 'site' }
		]
	}
];
