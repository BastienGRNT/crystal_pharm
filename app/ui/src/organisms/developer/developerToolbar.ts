/** Un compte de démo : un clic pour s'y connecter. */
export type DeveloperToolbarAccount = {
	label: string;
	description: string;
	href: string;
	isCurrent: boolean;
};

export type DeveloperToolbarAccountGroup = { title: string; accounts: DeveloperToolbarAccount[] };

/** Une action envoyée en POST (`actionName`) à l'adresse des actions de l'outil. */
export type DeveloperToolbarAction = { actionName: string; label: string; description: string; isDestructive?: boolean };

export type DeveloperToolbarActionGroup = { title: string; actions: DeveloperToolbarAction[] };

export type DeveloperToolbarEmail = {
	to: string;
	subject: string;
	text: string;
	sentAt: string;
	links: { label: string; url: string }[];
};

export type DeveloperToolbarContent = {
	/** Qui est connecté dans cette app, s'il y a quelqu'un. */
	signedInLabel: string | undefined;
	accountGroups: DeveloperToolbarAccountGroup[];
	actionGroups: DeveloperToolbarActionGroup[];
	emails: DeveloperToolbarEmail[];
	actionPathname: string;
};
