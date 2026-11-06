export type ColumnChartColumn = {
	key: string;
	value: number;
	/** Le titre de la bulle (« lundi 3 novembre »). */
	label: string;
	/** La valeur en mots (« 12 visites »), dans la bulle et pour les lecteurs d'écran. */
	valueLabel: string;
	/** Écrit sous l'axe ; sans lui, la colonne n'a pas d'étiquette visible. */
	axisLabel?: string;
	/** Dessinée pleine ; les autres plus pâles. */
	isEmphasized?: boolean;
};
