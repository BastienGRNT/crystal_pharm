import type { ShiftChipTone } from '../../atoms/shiftChip';

export type PlanningGridDay = {
	key: string;
	dayName: string;
	dayNumber: number;
	isToday: boolean;
	/** Une ligne sous le jour (« 4 pers. »). */
	detail?: string;
	/** Fait du jour un lien, vers la vue de cette journée. */
	href?: string;
};

export type PlanningGridSlot = {
	id: string;
	label: string;
	tone: ShiftChipTone;
};

export type PlanningGridCell = {
	key: string;
	slots: PlanningGridSlot[];
	absence?: { label: string; detail: string };
};

export type PlanningGridRow = {
	key: string;
	personName: string;
	personDetail: string;
	/** Une étiquette courte après le nom (« Ph » pour un pharmacien). */
	personTag?: string;
	/** Le total d'heures, aligné à droite du nom. */
	personHours?: string;
	cells: PlanningGridCell[];
};

/** Une ligne de synthèse sous la grille : un statut par jour. */
export type PlanningGridSummary = {
	label: string;
	cells: { key: string; tone: 'success' | 'danger' | 'neutral'; text: string }[];
};
