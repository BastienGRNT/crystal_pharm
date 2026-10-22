import type { IconName } from '../../atoms/icons/icons';
import type { ModuleKey } from '../../modules';

export type NavigationLink = {
	label: string;
	href: string;
	icon?: IconName;
	module?: ModuleKey;
};

export type SignedInUserSummary = {
	name: string;
	detail: string;
};

export function findCurrentNavigationLink(
	navigationLinks: readonly NavigationLink[],
	currentPathname: string
): NavigationLink | undefined {
	return navigationLinks.find(
		(navigationLink) =>
			currentPathname === navigationLink.href || currentPathname.startsWith(`${navigationLink.href}/`)
	);
}
