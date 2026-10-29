import type { ShiftChipTone } from '../../atoms/shiftChip';

export type PlanningTimelineHour = {
	label: string;
	percent: number;
};

export type PlanningTimelineBar = {
	id: string;
	label: string;
	startPercent: number;
	widthPercent: number;
	tone: ShiftChipTone;
	/** Ouvre le créneau pour le modifier. */
	editHref?: string;
};

export type PlanningTimelineRow = {
	key: string;
	personName: string;
	personDetail: string;
	personTag?: string;
	/** Le total d'heures, aligné à droite du nom. */
	personHours?: string;
	bars: PlanningTimelineBar[];
	absence?: { label: string; detail: string };
};

/** La plage d'ouverture sur l'axe : le reste est grisé. */
export type PlanningTimelineOpening = {
	startPercent: number;
	endPercent: number;
};

/** Une ligne de contrôle au-dessus des employés : des segments couverts ou non. */
export type PlanningTimelineCoverage = {
	label: string;
	/** Lu avant chaque segment non couvert, dont le libellé ne donne que les heures. */
	uncoveredLabel: string;
	segments: {
		key: string;
		startPercent: number;
		widthPercent: number;
		isCovered: boolean;
		label: string;
	}[];
};

export type PlanningTimelineNow = {
	percent: number;
	label: string;
};
