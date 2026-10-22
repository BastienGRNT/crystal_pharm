export type PlanningLegendSwatch = 'slotStrong' | 'slotSoft' | 'absence' | 'uncovered' | 'closed' | 'now';

export type PlanningLegendItem = {
	label: string;
	swatch: PlanningLegendSwatch;
};
