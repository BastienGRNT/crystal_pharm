/** Un compte de démo : un clic pour s'y connecter. */
export type DeveloperToolbarAccount = {
	label: string;
	description: string;
	/** Ce qui distingue ce compte au premier coup d'œil ; la recherche les lit aussi. */
	badges: string[];
	href: string;
	isCurrent: boolean;
};

export type DeveloperToolbarAccountGroup = { title: string; accounts: DeveloperToolbarAccount[] };

/** Une action envoyée en POST (`actionName`) à l'adresse des actions de l'outil. */
export type DeveloperToolbarAction = {
	actionName: string;
	label: string;
	description: string;
	/** Demande un second clic avant de partir. */
	isDestructive?: boolean;
};

export type DeveloperToolbarActionGroup = { title: string; actions: DeveloperToolbarAction[] };

export type DeveloperToolbarEmail = {
	to: string;
	subject: string;
	text: string;
	sentAt: string;
	links: { label: string; url: string }[];
};

export type DeveloperToolbarFactTone = 'neutral' | 'success' | 'warning';

export type DeveloperToolbarFact = { label: string; value: string; tone?: DeveloperToolbarFactTone };

/** Ce qu'il faut savoir du compte connecté ici, sans aller le chercher dans l'app. */
export type DeveloperToolbarContext = {
	title: string;
	subtitle?: string;
	facts: DeveloperToolbarFact[];
	links: { label: string; href: string }[];
};

/** Ce que la dernière action a fait, montré une fois. */
export type DeveloperToolbarNotice = { message: string; tone: 'success' | 'warning' };

export type DeveloperToolbarContent = {
	/** Qui est connecté dans cette app, s'il y a quelqu'un. */
	signedInLabel: string | undefined;
	currentContext: DeveloperToolbarContext | undefined;
	accountGroups: DeveloperToolbarAccountGroup[];
	/** Les actions sur le compte connecté ici. */
	accountActionGroups: DeveloperToolbarActionGroup[];
	/** Les actions qui touchent toutes les démos. */
	globalActionGroups: DeveloperToolbarActionGroup[];
	emails: DeveloperToolbarEmail[];
	notice: DeveloperToolbarNotice | undefined;
	actionPathname: string;
};
