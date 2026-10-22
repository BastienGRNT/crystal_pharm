import type { SegmentedControlOption } from '@crystal-pharm/ui';
import type { PlanningTimelineHour, PlanningTimelineRow } from '../components/organisms/day/planningTimeline';
import type { PlanningGridDay, PlanningGridRow } from '../components/organisms/week/planningGrid';
import type { Employee } from '../domain/planning';

export type PeriodNavigation = {
	label: string;
	previousHref: string;
	nextHref: string;
	navigationLabel: string;
	previousLabel: string;
	nextLabel: string;
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
	context: string;
	defaultShiftDate: string;
	employees: Employee[];
};

export type WeekViewData = CommonPlanningPageData & {
	view: 'week';
	days: PlanningGridDay[];
	rows: PlanningGridRow[];
};

export type DayViewData = CommonPlanningPageData & {
	view: 'day';
	hours: PlanningTimelineHour[];
	rows: PlanningTimelineRow[];
	nowPercent: number | undefined;
	nowLabel: string | undefined;
};

export type PlanningPageData = WeekViewData | DayViewData;

export type AddShiftFailure = {
	message: string;
	values: Record<string, string>;
};
