import type { AvailabilityKind, AvailabilityStatus } from '../domain/availability/availabilityRules';
import type { AbsenceStatus, RequestableLeaveKind } from '../domain/leave/leaveRequests';

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

export type MyLeaveView = {
	id: string;
	summary: string;
	status: AbsenceStatus;
	statusLabel: string;
	note: string;
	/** Seulement tant que la demande attend sa réponse. */
	canCancel: boolean;
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
	/** Les congés à venir ou en cours, demandés ou posés par le titulaire. */
	leaves: MyLeaveView[];
	requestableLeaveKinds: RequestableLeaveKind[];
	/** Le premier jour qu'on peut demander. */
	todayDate: string;
	requestLeaveFormAction: string;
	cancelLeaveFormAction: string;
};

export type LeaveRequestFailure = {
	leaveMessage: string;
	leaveValues: Record<string, string>;
};

/** La demande est partie : ce que le planning dit déjà de l'effectif ces jours-là. */
export type LeaveRequestFeedback = {
	leaveConfirmation: string;
	isTeamSufficient: boolean;
};

export type AddAvailabilityFailure = {
	message: string;
	values: Record<string, string>;
};
