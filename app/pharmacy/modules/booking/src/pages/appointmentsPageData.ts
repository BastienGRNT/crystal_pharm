import type {
	AgendaColumn,
	AgendaHour,
	DescriptionItem,
	FilterTab,
	SegmentedControlOption,
	SelectMenuOption,
	StatusBadgeTone
} from '@crystal-pharm/ui';

export type AppointmentsView = 'list' | 'day' | 'week';

export type AppointmentRow = {
	id: string;
	href: string;
	startTime: string;
	endTime: string;
	patientName: string;
	patientPhone: string;
	reason: string;
	employeeName: string;
	statusLabel: string;
	statusTone: StatusBadgeTone;
	isCancelled: boolean;
	/** Une demande en attente se confirme depuis la liste, sans ouvrir la fiche. */
	quickConfirm: { formAction: string; notifiesByEmail: boolean } | null;
};

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

export type AppointmentsEmptyState = {
	title: string;
	description: string;
	showAllHref: string | null;
};

export type AppointmentDetailPanel = {
	closeHref: string;
	appointmentId: string;
	patientName: string;
	statusLabel: string;
	statusTone: StatusBadgeTone;
	items: DescriptionItem[];
	confirmFormAction: string | null;
	cancelFormAction: string | null;
	/** L'adresse à prévenir d'une confirmation ou d'une annulation ; null s'il n'en a pas laissé. */
	patientEmail: string | null;
};

export type AddAppointmentPanel = {
	closeHref: string;
	formAction: string;
	employeeOptions: SelectMenuOption[];
	reasonOptions: SelectMenuOption[];
	/** Pour proposer l'heure de fin dès que le motif et le début sont choisis. */
	reasonDurationsInMinutes: Record<string, number>;
	defaultDate: string;
};

export type CommonAppointmentsPageData = {
	context: string;
	viewOptions: SegmentedControlOption[];
	periodNavigation: PeriodNavigation;
	statusTabs: FilterTab[];
	addAppointmentHref: string;
	emptyState: AppointmentsEmptyState;
	detailPanel: AppointmentDetailPanel | null;
	addAppointmentPanel: AddAppointmentPanel | null;
};

type ListViewData = CommonAppointmentsPageData & {
	view: 'list';
	rows: AppointmentRow[];
};

type AgendaViewData = CommonAppointmentsPageData & {
	view: 'day' | 'week';
	agendaLabel: string;
	hours: AgendaHour[];
	columns: AgendaColumn[];
};

export type AppointmentsPageData = ListViewData | AgendaViewData;

export const appointmentFormFieldNames = [
	'patientName',
	'patientPhone',
	'reason',
	'employeeId',
	'date',
	'startTime',
	'endTime'
] as const;

export type AppointmentFormFieldName = (typeof appointmentFormFieldNames)[number];

export type AppointmentFormValues = Record<AppointmentFormFieldName, string> & {
	/** Facultatif : vide si le patient ne veut pas de confirmation par email. */
	patientEmail: string;
};

export type AppointmentsActionFailure = {
	message: string;
	/** Le champ à corriger, quand l'erreur en vise un : le message s'affiche dessous. */
	failedFieldName?: AppointmentFormFieldName | 'patientEmail';
	values?: AppointmentFormValues;
};
