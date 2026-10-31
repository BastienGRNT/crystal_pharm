export type PlanningLegendSwatch = 'absence' | 'uncovered' | 'closed' | 'now';

export type PlanningLegendItem = {
	label: string;
	swatch: PlanningLegendSwatch;
};
