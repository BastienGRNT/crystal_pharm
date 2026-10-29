import type { SegmentedControlOption } from '@crystal-pharm/ui';
import type {
	PlanningTimelineCoverage,
	PlanningTimelineHour,
	PlanningTimelineNow,
	PlanningTimelineOpening,
	PlanningTimelineRow
} from '../components/organisms/day/planningTimeline';
import type { PlanningGridDay, PlanningGridRow, PlanningGridSummary } from '../components/organisms/week/planningGrid';
import type { PlanningIssueSeverity } from '../domain/issues/planningIssues';
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

export type EditShiftPanel = {
	closeHref: string;
	shiftId: string;
	values: Record<'employeeId' | 'date' | 'startTime' | 'endTime', string>;
};

export type FormActions = {
	addShiftPanel: AddShiftPanel;
	/** Le créneau en cours de modification ; absent quand aucun n'est ouvert. */
	editShiftPanel: EditShiftPanel | undefined;
	addShiftFormAction: string;
	/** Le début du lien qui ouvre un créneau : on y ajoute son identifiant. */
	editShiftHrefPrefix: string;
	updateShiftFormAction: string;
	deleteShiftFormAction: string;
	publishWeekFormAction: string;
	returnWeekToDraftFormAction: string;
};

export type WeekStatusSummary = {
	isDraft: boolean;
	/** Le lundi de la semaine concernée, que les actions de publication reçoivent. */
	mondayDate: string;
};

export type PlanningIssueView = {
	key: string;
	severity: PlanningIssueSeverity;
	message: string;
	/** La journée concernée, dans la vue journée. */
	dayHref: string;
};

export type CommonPlanningPageData = FormActions & {
	viewOptions: SegmentedControlOption[];
	periodNavigation: PeriodNavigation;
	title: string;
	context: string;
	defaultShiftDate: string;
	employees: Employee[];
	weekStatus: WeekStatusSummary;
	issues: PlanningIssueView[];
	settingsHref: string;
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
