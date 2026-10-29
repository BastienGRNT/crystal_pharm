import type { SegmentedControlOption } from '@crystal-pharm/ui';
import type {
	PlanningTimelineHour,
	PlanningTimelineNow,
	PlanningTimelineOpening,
	PlanningTimelineRow
} from '../components/organisms/day/planningTimeline';
import type { LiveWeekInput } from '../domain/live/liveWeek';
import type { Employee } from '../domain/planning';
import type { WeekTemplateView } from './planningSettingsPageData';

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
	decideAvailabilityFormAction: string;
	saveTemplatePanel: AddShiftPanel;
	applyTemplatePanel: AddShiftPanel;
	generateWeekFormAction: string;
	saveTemplateFormAction: string;
	applyTemplateFormAction: string;
	publishWeekFormAction: string;
	returnWeekToDraftFormAction: string;
};

export type WeekStatusSummary = {
	isDraft: boolean;
	/** Le lundi de la semaine concernée, que les actions de publication reçoivent. */
	mondayDate: string;
};

export type PendingAvailabilityRequestView = {
	ruleId: string;
	employeeName: string;
	summary: string;
	note: string;
};

export type CommonPlanningPageData = FormActions & {
	viewOptions: SegmentedControlOption[];
	periodNavigation: PeriodNavigation;
	title: string;
	context: string;
	defaultShiftDate: string;
	employees: Employee[];
	weekStatus: WeekStatusSummary;
	/** Toute la semaine : le navigateur y rejoue chaque geste pour juger le résultat avant l'enregistrement. */
	live: LiveWeekInput;
	/** Le début du lien vers une journée : on y ajoute sa date. */
	dayHrefPrefix: string;
	pendingAvailabilityRequests: PendingAvailabilityRequestView[];
	settingsHref: string;
	templates: WeekTemplateView[];
};

export type WeekViewData = CommonPlanningPageData & {
	view: 'week';
	todayDate: string;
};

export type DayViewData = CommonPlanningPageData & {
	view: 'day';
	hours: PlanningTimelineHour[];
	/** L'axe en minutes depuis minuit, pour convertir un geste en heures. */
	timelineMinutes: { startMinutes: number; endMinutes: number };
	date: string;
	rows: PlanningTimelineRow[];
	opening: PlanningTimelineOpening | undefined;
	now: PlanningTimelineNow | undefined;
};

export type PlanningPageData = WeekViewData | DayViewData;

export type WeekGenerationReportView = { addedCount: number; explanations: string[]; unfilledGaps: string[] };

export type WeekGenerationFeedback = { generationReport: WeekGenerationReportView; closeHref: string };

/** Résultat d'une action de la semaine qui ne redirige pas, pour en afficher le message. */
export type WeekActionFeedback = { message: string; isSuccess?: boolean };

export type AddShiftFailure = {
	message: string;
	values: Record<string, string>;
};
