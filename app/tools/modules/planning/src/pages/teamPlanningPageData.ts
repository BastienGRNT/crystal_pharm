import type {
	PlanningGridDay,
	PlanningGridRow,
	PlanningGridSummary,
	PlanningTimelineCoverage,
	PlanningTimelineHour,
	PlanningTimelineNow,
	PlanningTimelineOpening,
	PlanningTimelineRow,
	SegmentedControlOption
} from '@crystal-pharm/ui';
import type { Employee } from '../domain/planning';

export type PeriodNavigation = {
	label: string;
	previousHref: string;
	nextHref: string;
	navigationLabel: string;
	previousLabel: string;
	nextLabel: string;
	/** Absent quand la période affichée contient déjà aujourd'hui. */
	todayHref: string | undefined;
};

export type AddShiftPanel = {
	isOpen: boolean;
	openHref: string;
	closeHref: string;
};

export type FormActions = {
	addShiftPanel: AddShiftPanel;
	addShiftFormAction: string;
	deleteShiftFormAction: string;
};

export type CommonPlanningPageData = FormActions & {
	viewOptions: SegmentedControlOption[];
	periodNavigation: PeriodNavigation;
	title: string;
	context: string;
	defaultShiftDate: string;
	employees: Employee[];
};

export type WeekViewData = CommonPlanningPageData & {
	view: 'week';
	days: PlanningGridDay[];
	rows: PlanningGridRow[];
	pharmacistCoverage: PlanningGridSummary;
};

export type DayViewData = CommonPlanningPageData & {
	view: 'day';
	hours: PlanningTimelineHour[];
	rows: PlanningTimelineRow[];
	opening: PlanningTimelineOpening | undefined;
	pharmacistCoverage: PlanningTimelineCoverage | undefined;
	now: PlanningTimelineNow | undefined;
};

export type PlanningPageData = WeekViewData | DayViewData;

export type AddShiftFailure = {
	message: string;
	values: Record<string, string>;
};
