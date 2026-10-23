export type PlanningLegendSwatch = 'shiftStrong' | 'shiftSoft' | 'absence' | 'uncovered' | 'closed' | 'now';

export type PlanningLegendItem = {
	label: string;
	swatch: PlanningLegendSwatch;
};
