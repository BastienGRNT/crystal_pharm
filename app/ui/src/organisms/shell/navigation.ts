import type { IconName } from '../../atoms/icons/icons';
import type { ModuleKey } from '../../modules';

export type NavigationLink = {
	label: string;
	/** Le nom sous l'icône de la barre du bas, sur un téléphone, quand `label` y serait coupé. */
	shortLabel?: string;
	href: string;
	icon?: IconName;
	module?: ModuleKey;
	/** D'autres pages rangées sous ce lien (ses onglets) : le lien reste allumé sur elles. */
	alsoCurrentFor?: readonly string[];
};

export type SignedInUserSummary = {
	name: string;
	detail: string;
};

export function findCurrentNavigationLink(
	navigationLinks: readonly NavigationLink[],
	currentPathname: string
): NavigationLink | undefined {
	const isUnder = (pathname: string): boolean => currentPathname === pathname || currentPathname.startsWith(`${pathname}/`);
	return navigationLinks.find(
		(navigationLink) => isUnder(navigationLink.href) || (navigationLink.alsoCurrentFor ?? []).some(isUnder)
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
