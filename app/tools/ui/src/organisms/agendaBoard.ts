export type AgendaHour = {
	label: string;
	percent: number;
};

/** confirmed : à la couleur du module ; pending : en pointillés, reste à confirmer ; cancelled : grisé et barré. */
export type AgendaEventTone = 'confirmed' | 'pending' | 'cancelled';

export type AgendaEvent = {
	id: string;
	href: string;
	timeLabel: string;
	title: string;
	detail: string;
	/** Lu par les lecteurs d'écran après le titre (« en attente »). */
	statusLabel: string;
	tone: AgendaEventTone;
	topPercent: number;
	heightPercent: number;
	leftPercent: number;
	widthPercent: number;
};

export type AgendaColumn = {
	key: string;
	title: string;
	detail?: string;
	isCurrent?: boolean;
	/** Fait de l'en-tête un lien (vers la journée, par exemple). */
	href?: string;
	events: AgendaEvent[];
	/** Position de l'heure actuelle dans cette colonne, seulement le jour même. */
	nowPercent?: number;
};
