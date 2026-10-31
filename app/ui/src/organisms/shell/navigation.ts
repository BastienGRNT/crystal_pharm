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

/** Une notification de la cloche : un message, et la page où agir. */
export type NotificationItem = {
	id: string;
	message: string;
	href: string;
	isRead: boolean;
	/** « il y a 5 min », « hier »… : déjà formulé par l'app. */
	timeLabel: string;
};

export type NotificationsSummary = {
	items: readonly NotificationItem[];
	/** Appelé à la première ouverture : l'app y marque les notifications comme lues. */
	onOpen: () => void;
};
