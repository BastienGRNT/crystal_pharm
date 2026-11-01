export type HeatGridCell = {
	value: number;
	/** La case en mots (« mardi de 10 h à 11 h : 14 visites »), lue au survol et par les lecteurs d'écran. */
	label: string;
};

export type HeatGridRow = { key: string; label: string; cells: HeatGridCell[] };
