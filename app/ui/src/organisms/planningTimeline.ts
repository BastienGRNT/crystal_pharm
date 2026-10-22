export type PlanningTimelineHour = {
	label: string;
	percent: number;
};

export type PlanningTimelineBar = {
	id: string;
	label: string;
	startPercent: number;
	widthPercent: number;
};

export type PlanningTimelineRow = {
	key: string;
	personName: string;
	personDetail: string;
	personTag?: string;
	bars: PlanningTimelineBar[];
	absence?: { label: string; detail: string };
};
