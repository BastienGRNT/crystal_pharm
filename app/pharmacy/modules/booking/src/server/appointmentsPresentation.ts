import type {
	AgendaColumn,
	AgendaEvent,
	AgendaEventTone,
	AgendaHour,
	FilterTab,
	SegmentedControlOption,
	StatusBadgeTone
} from '@crystal-pharm/ui';
import {
	assignOverlapLanes,
	computeAgendaHourRange,
	formatHour,
	listAgendaHours,
	toAgendaPercent,
	type AgendaHourRange
} from '../domain/agenda';
import {
	appointmentStatuses,
	formatAppointmentHours,
	listAppointmentsOfDay,
	listAppointmentsOfEmployee,
	type Appointment,
	type AppointmentCountsByStatus,
	type AppointmentStatus,
	type AppointmentStatusFilter,
	type BookableEmployee
} from '../domain/appointment';
import {
	addDays,
	formatDayColumnTitle,
	formatFullDay,
	formatShortDay,
	formatWeekRange,
	getMondayOfWeek,
	isSameDay,
	listWeekDays,
	toIsoDate
} from '../domain/day';
import type {
	AppointmentRow,
	AppointmentsEmptyState,
	AppointmentsView,
	PeriodNavigation
} from '../pages/appointmentsPageData';
import { buildPageHref, type AppointmentsPageQuery } from './appointmentsPageQuery';

type StatusPresentation = {
	label: string;
	tabLabel: string;
	badgeTone: StatusBadgeTone;
	agendaTone: AgendaEventTone;
};

export const statusPresentations: Record<AppointmentStatus, StatusPresentation> = {
	pending: { label: 'En attente', tabLabel: 'En attente', badgeTone: 'warning', agendaTone: 'pending' },
	confirmed: { label: 'Confirmé', tabLabel: 'Confirmés', badgeTone: 'success', agendaTone: 'confirmed' },
	cancelled: { label: 'Annulé', tabLabel: 'Annulés', badgeTone: 'neutral', agendaTone: 'cancelled' }
};

const defaultAgendaHourRange: AgendaHourRange = { firstHour: 8, lastHour: 20 };

const viewLabels: Record<AppointmentsView, string> = { list: 'Liste', day: 'Journée', week: 'Semaine' };

export type AppointmentsPeriod = {
	days: Date[];
	label: string;
};

export type EmployeeDirectory = Map<string, BookableEmployee>;

/** `today` est le jour calendaire de `now`, pour comparer des jours sans décalage horaire. */
export type AgendaClock = {
	today: Date;
	now: Date;
};

export function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

function pluralize(count: number, singular: string, plural: string): string {
	return `${count} ${count > 1 ? plural : singular}`;
}

function countAppointmentsLabel(count: number): string {
	return pluralize(count, 'rendez-vous', 'rendez-vous');
}

export function findEmployeeName(employees: EmployeeDirectory, employeeId: string): string {
	return employees.get(employeeId)?.fullName ?? 'Employé inconnu';
}

export function buildPeriod(query: AppointmentsPageQuery): AppointmentsPeriod {
	if (query.view !== 'week') return { days: [query.day], label: capitalize(formatFullDay(query.day)) };
	const monday = getMondayOfWeek(query.day);
	return { days: listWeekDays(monday), label: `Semaine ${formatWeekRange(monday)}` };
}

export function buildContext(period: AppointmentsPeriod, counts: AppointmentCountsByStatus): string {
	const parts = [period.label, countAppointmentsLabel(counts.all)];
	if (counts.pending > 0) parts.push(`${counts.pending} en attente`);
	return parts.join(' · ');
}

export function buildViewOptions(query: AppointmentsPageQuery): SegmentedControlOption[] {
	const views: AppointmentsView[] = ['list', 'day', 'week'];
	return views.map((view) => ({
		label: viewLabels[view],
		href: buildPageHref(query, { view }),
		isCurrent: query.view === view
	}));
}

export function buildPeriodNavigation(query: AppointmentsPageQuery, today: Date): PeriodNavigation {
	if (query.view === 'week') {
		const monday = getMondayOfWeek(query.day);
		const isCurrentWeek = isSameDay(monday, getMondayOfWeek(today));
		return {
			label: formatWeekRange(monday),
			previousHref: buildPageHref(query, { day: addDays(monday, -7) }),
			nextHref: buildPageHref(query, { day: addDays(monday, 7) }),
			navigationLabel: 'Semaine affichée',
			previousLabel: 'Semaine précédente',
			nextLabel: 'Semaine suivante',
			todayHref: isCurrentWeek ? undefined : buildPageHref(query, { day: today })
		};
	}
	return {
		label: formatShortDay(query.day),
		previousHref: buildPageHref(query, { day: addDays(query.day, -1) }),
		nextHref: buildPageHref(query, { day: addDays(query.day, 1) }),
		navigationLabel: 'Jour affiché',
		previousLabel: 'Jour précédent',
		nextLabel: 'Jour suivant',
		todayHref: isSameDay(query.day, today) ? undefined : buildPageHref(query, { day: today })
	};
}

export function buildStatusTabs(query: AppointmentsPageQuery, counts: AppointmentCountsByStatus): FilterTab[] {
	const statusFilters: AppointmentStatusFilter[] = ['all', ...appointmentStatuses];
	return statusFilters.map((statusFilter) => ({
		label: statusFilter === 'all' ? 'Tous' : statusPresentations[statusFilter].tabLabel,
		href: buildPageHref(query, { statusFilter }),
		isCurrent: query.statusFilter === statusFilter,
		count: counts[statusFilter]
	}));
}

export function buildEmptyState(query: AppointmentsPageQuery, period: AppointmentsPeriod): AppointmentsEmptyState {
	const periodText = query.view === 'week' ? 'cette semaine' : `le ${formatFullDay(query.day)}`;
	if (query.statusFilter === 'all') {
		return { title: 'Aucun rendez-vous', description: `Aucun rendez-vous n’est prévu ${periodText}.`, showAllHref: null };
	}
	return {
		title: `Aucun rendez-vous ${statusPresentations[query.statusFilter].label.toLowerCase()}`,
		description: `${period.label} : les autres rendez-vous restent visibles sans filtre.`,
		showAllHref: buildPageHref(query, { statusFilter: 'all' })
	};
}

export function buildAppointmentRows(
	query: AppointmentsPageQuery,
	appointments: readonly Appointment[],
	employees: EmployeeDirectory
): AppointmentRow[] {
	return appointments.map((appointment) => {
		const statusPresentation = statusPresentations[appointment.status];
		return {
			id: appointment.id,
			href: buildPageHref(query, {}, { kind: 'detail', appointmentId: appointment.id }),
			hours: formatAppointmentHours(appointment),
			patientName: appointment.patientName,
			patientPhone: appointment.patientPhone,
			reason: appointment.reason,
			employeeName: findEmployeeName(employees, appointment.employeeId),
			statusLabel: statusPresentation.label,
			statusTone: statusPresentation.badgeTone,
			isCancelled: appointment.status === 'cancelled'
		};
	});
}

export function buildAgendaHourRange(appointments: readonly Appointment[]): AgendaHourRange {
	return computeAgendaHourRange(appointments, defaultAgendaHourRange);
}

export function buildAgendaHours(hourRange: AgendaHourRange): AgendaHour[] {
	return listAgendaHours(hourRange).map((hour) => ({
		label: formatHour(hour),
		percent: toAgendaPercent(formatHour(hour), hourRange)
	}));
}

function buildAgendaEvents(
	query: AppointmentsPageQuery,
	appointments: readonly Appointment[],
	hourRange: AgendaHourRange,
	describeAppointment: (appointment: Appointment) => string
): AgendaEvent[] {
	const lanes = assignOverlapLanes(appointments);
	return appointments.map((appointment) => {
		const { laneIndex, laneCount } = lanes.get(appointment.id) ?? { laneIndex: 0, laneCount: 1 };
		const topPercent = toAgendaPercent(appointment.startTime, hourRange);
		const statusPresentation = statusPresentations[appointment.status];
		return {
			id: appointment.id,
			href: buildPageHref(query, {}, { kind: 'detail', appointmentId: appointment.id }),
			timeLabel: appointment.startTime,
			title: appointment.patientName,
			detail: describeAppointment(appointment),
			statusLabel: statusPresentation.label.toLowerCase(),
			tone: statusPresentation.agendaTone,
			topPercent,
			heightPercent: toAgendaPercent(appointment.endTime, hourRange) - topPercent,
			leftPercent: (laneIndex / laneCount) * 100,
			widthPercent: 100 / laneCount
		};
	});
}

/** La ligne de l'heure actuelle, seulement le jour même et dans la plage affichée. */
function findNowPercent(day: Date, { today, now }: AgendaClock, hourRange: AgendaHourRange): number | undefined {
	if (!isSameDay(day, today)) return undefined;
	const currentHour = now.getHours();
	if (currentHour < hourRange.firstHour || currentHour >= hourRange.lastHour) return undefined;
	const currentTime = `${String(currentHour).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	return toAgendaPercent(currentTime, hourRange);
}

export function buildEmployeeColumns(
	query: AppointmentsPageQuery,
	appointments: readonly Appointment[],
	employees: EmployeeDirectory,
	hourRange: AgendaHourRange,
	clock: AgendaClock
): AgendaColumn[] {
	const nowPercent = findNowPercent(query.day, clock, hourRange);
	return [...employees.values()].map((employee) => ({
		key: employee.id,
		title: employee.fullName,
		detail: employee.jobTitle,
		events: buildAgendaEvents(
			query,
			listAppointmentsOfEmployee(appointments, employee.id),
			hourRange,
			(appointment) => appointment.reason
		),
		nowPercent
	}));
}

export function buildDayColumns(
	query: AppointmentsPageQuery,
	period: AppointmentsPeriod,
	appointments: readonly Appointment[],
	employees: EmployeeDirectory,
	hourRange: AgendaHourRange,
	clock: AgendaClock
): AgendaColumn[] {
	return period.days.map((day) => {
		const appointmentsOfDay = listAppointmentsOfDay(appointments, toIsoDate(day));
		return {
			key: toIsoDate(day),
			title: formatDayColumnTitle(day),
			detail: countAppointmentsLabel(appointmentsOfDay.length),
			isCurrent: isSameDay(day, clock.today),
			href: buildPageHref(query, { day, view: 'day' }),
			events: buildAgendaEvents(
				query,
				appointmentsOfDay,
				hourRange,
				(appointment) => `${appointment.reason} · ${findEmployeeName(employees, appointment.employeeId)}`
			),
			nowPercent: findNowPercent(day, clock, hourRange)
		};
	});
}
