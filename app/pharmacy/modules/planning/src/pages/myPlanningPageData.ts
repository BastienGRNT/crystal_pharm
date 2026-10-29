import type { AvailabilityKind, AvailabilityStatus } from '../domain/availability/availabilityRules';

export type MyPlanningDay = {
	date: string;
	title: string;
	isToday: boolean;
	shiftLabels: string[];
	absenceLabel: string | undefined;
};

export type MyAvailabilityRuleView = {
	id: string;
	kind: AvailabilityKind;
	kindLabel: string;
	summary: string;
	note: string;
	status: AvailabilityStatus;
};

export type MyPlanningNoticeView = {
	id: string;
	message: string;
	isRead: boolean;
};

export type MyPlanningPageData = {
	firstName: string;
	periodLabel: string;
	previousWeekHref: string;
	nextWeekHref: string;
	todayHref: string | undefined;
	/** Faux pour une semaine encore en brouillon : l'équipe ne la voit pas. */
	isWeekPublished: boolean;
	days: MyPlanningDay[];
	plannedDurationLabel: string;
	rules: MyAvailabilityRuleView[];
	notices: MyPlanningNoticeView[];
	/** Dit si une demande est acceptée sans que le titulaire ait à la valider. */
	isAvailabilityAutomaticallyValidated: boolean;
	addAvailabilityFormAction: string;
	removeAvailabilityFormAction: string;
};

export type AddAvailabilityFailure = {
	message: string;
	values: Record<string, string>;
};
