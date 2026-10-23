import type { IconName } from './atoms/icons';
import type { ModuleKey } from './modules';

export type ToolLink = {
	label: string;
	href: string;
	icon?: IconName;
	module?: ModuleKey;
	/** Ce que l'outil permet de faire, en une phrase, pour la page d'accueil. */
	description?: string;
};

export const toolLinks: readonly ToolLink[] = [
	{ label: 'Accueil', href: '/', icon: 'house', module: 'accueil' },
	{
		label: 'Site',
		href: '/site-manager',
		icon: 'globe-simple',
		module: 'site',
		description: 'Le site de la pharmacie : ses pages, ses horaires et ses services.'
	},
	{
		label: 'Rendez-vous',
		href: '/booking',
		icon: 'calendar-check',
		module: 'rdv',
		description: 'Les rendez-vous des patients, à confirmer, ajouter ou annuler.'
	},
	{
		label: 'Ordonnances',
		href: '/prescriptions',
		icon: 'prescription',
		module: 'ordo',
		description: 'Les ordonnances envoyées par les patients, à préparer.'
	},
	{
		label: 'Planning',
		href: '/planning',
		icon: 'calendar-dots',
		module: 'planning',
		description: 'Les créneaux de l’équipe, à la journée ou à la semaine.'
	},
];

const homeToolHref = '/';

export function findCurrentToolHref(pathname: string): string {
	const currentToolLink = toolLinks
		.filter((toolLink) => toolLink.href !== homeToolHref)
		.find((toolLink) => pathname === toolLink.href || pathname.startsWith(`${toolLink.href}/`));
	return currentToolLink?.href ?? homeToolHref;
}
