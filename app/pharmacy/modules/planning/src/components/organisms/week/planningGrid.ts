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
	cells: PlanningGridCell[];
};
