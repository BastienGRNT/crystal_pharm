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
	hours: string;
	patientName: string;
	patientInitials: string;
	patientPhone: string;
	reason: string;
	employeeName: string;
	statusLabel: string;
	statusTone: StatusBadgeTone;
	isCancelled: boolean;
};

export type PeriodNavigation = {
	label: string;
	previousHref: string;
	nextHref: string;
	navigationLabel: string;
	previousLabel: string;
	nextLabel: string;
	todayHref: string | null;
};

export type AppointmentsEmptyState = {
	title: string;
	text: string;
	showAllHref: string | null;
};

export type AppointmentDetailPanel = {
	closeHref: string;
	appointmentId: string;
	patientName: string;
	patientInitials: string;
	statusLabel: string;
	statusTone: StatusBadgeTone;
	items: DescriptionItem[];
	confirmFormAction: string | null;
	cancelFormAction: string | null;
};

export type AddAppointmentPanel = {
	closeHref: string;
	formAction: string;
	employeeOptions: SelectMenuOption[];
	reasonOptions: SelectMenuOption[];
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

export type ListViewData = CommonAppointmentsPageData & {
	view: 'list';
	rows: AppointmentRow[];
};

export type AgendaViewData = CommonAppointmentsPageData & {
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

export type AppointmentFormValues = Record<AppointmentFormFieldName, string>;

export type AppointmentsActionFailure = {
	message: string;
	values?: AppointmentFormValues;
};
