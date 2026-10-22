export type ToolLink = {
	label: string;
	href: string;
};

export const toolLinks: readonly ToolLink[] = [
	{ label: 'Accueil', href: '/' },
	{ label: 'Mon site', href: '/site-manager' },
	{ label: 'Planning', href: '/planning' },
	{ label: 'Rendez-vous', href: '/booking' },
	{ label: 'Ordonnances', href: '/prescriptions' },
];

const homeToolHref = '/';

export function findCurrentToolHref(pathname: string): string {
	const currentToolLink = toolLinks
		.filter((toolLink) => toolLink.href !== homeToolHref)
		.find((toolLink) => pathname === toolLink.href || pathname.startsWith(`${toolLink.href}/`));
	return currentToolLink?.href ?? homeToolHref;
}
