import type { IconName } from './atoms/icon/phosphorIcons';

export type ModuleKey = 'equipe' | 'planning' | 'absences' | 'site' | 'reglages';

export type NavigationLink = {
	label: string;
	href: string;
	icon: IconName;
	module?: ModuleKey;
};

export type NavigationSection = {
	label?: string;
	links: readonly NavigationLink[];
};

export type SignedInUserSummary = {
	name: string;
	detail: string;
};

export type CurrentNavigationLocation = {
	link: NavigationLink;
	sectionLabel?: string | undefined;
};

export function findCurrentNavigationLocation(
	navigationSections: readonly NavigationSection[],
	currentPathname: string
): CurrentNavigationLocation | undefined {
	for (const navigationSection of navigationSections) {
		const currentLink = navigationSection.links.find((navigationLink) =>
			isPathnameInsideLink(currentPathname, navigationLink)
		);
		if (currentLink) return { link: currentLink, sectionLabel: navigationSection.label };
	}
	return undefined;
}

function isPathnameInsideLink(pathname: string, navigationLink: NavigationLink): boolean {
	return pathname === navigationLink.href || pathname.startsWith(`${navigationLink.href}/`);
}
