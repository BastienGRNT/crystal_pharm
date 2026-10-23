import { fail, redirect, type Actions } from '@sveltejs/kit';
import {
	countAppointmentsByStatus,
	filterAppointmentsByStatus,
	sortAppointmentsByStartTime,
	type Appointment
} from '../domain/appointment';
import { toCalendarDay, toIsoDate } from '../domain/day';
import type {
	AppointmentsActionFailure,
	AppointmentsPageData,
	CommonAppointmentsPageData
} from '../pages/appointmentsPageData';
import {
	cancelAppointment,
	confirmAppointment,
	createAppointment,
	findAppointment,
	listAppointmentReasons,
	listAppointmentsOfDays,
	listBookableEmployees
} from './api/appointmentsApi';
import { readAppointmentFormValues, validateAppointmentForm } from './appointmentForm';
import { buildAddAppointmentPanel, buildDetailPanel } from './appointmentPanels';
import { buildPageHref, parsePageQuery, parsePanel, type AppointmentsPageQuery } from './appointmentsPageQuery';
import {
	buildAgendaHourRange,
	buildAgendaHours,
	buildAppointmentRows,
	buildContext,
	buildDayColumns,
	buildEmployeeColumns,
	buildEmptyState,
	buildPeriod,
	buildPeriodNavigation,
	buildStatusTabs,
	buildViewOptions,
	type AgendaClock,
	type EmployeeDirectory
} from './appointmentsPresentation';

async function loadEmployeeDirectory(): Promise<EmployeeDirectory> {
	const employees = await listBookableEmployees();
	return new Map(employees.map((employee) => [employee.id, employee]));
}

async function buildPanels(
	url: URL,
	query: AppointmentsPageQuery,
	employees: EmployeeDirectory
): Promise<Pick<CommonAppointmentsPageData, 'detailPanel' | 'addAppointmentPanel'>> {
	const panel = parsePanel(url);
	if (panel.kind === 'add') {
		return { detailPanel: null, addAppointmentPanel: buildAddAppointmentPanel(query, employees, await listAppointmentReasons()) };
	}
	const appointment = panel.kind === 'detail' ? await findAppointment(panel.appointmentId) : undefined;
	return {
		detailPanel: appointment ? buildDetailPanel(query, appointment, employees) : null,
		addAppointmentPanel: null
	};
}

export async function load({ url }: { url: URL }): Promise<AppointmentsPageData> {
	const now = new Date();
	const clock: AgendaClock = { today: toCalendarDay(now), now };
	const query = parsePageQuery(url, clock.today);
	const period = buildPeriod(query);
	const employees = await loadEmployeeDirectory();

	const appointmentsOfPeriod = sortAppointmentsByStartTime(await listAppointmentsOfDays(period.days.map(toIsoDate)));
	const counts = countAppointmentsByStatus(appointmentsOfPeriod);
	const shownAppointments: Appointment[] = filterAppointmentsByStatus(appointmentsOfPeriod, query.statusFilter);

	const commonData: CommonAppointmentsPageData = {
		context: buildContext(period, counts),
		viewOptions: buildViewOptions(query),
		periodNavigation: buildPeriodNavigation(query, clock.today),
		statusTabs: buildStatusTabs(query, counts),
		addAppointmentHref: buildPageHref(query, {}, { kind: 'add' }),
		emptyState: buildEmptyState(query, period),
		...(await buildPanels(url, query, employees))
	};

	if (query.view === 'list') {
		return { ...commonData, view: 'list', rows: buildAppointmentRows(query, shownAppointments, employees) };
	}

	const hourRange = buildAgendaHourRange(shownAppointments);
	return {
		...commonData,
		view: query.view,
		agendaLabel: query.view === 'day' ? 'Rendez-vous de la journée, par employé' : 'Rendez-vous de la semaine, par jour',
		hours: buildAgendaHours(hourRange),
		columns:
			query.view === 'day'
				? buildEmployeeColumns(query, shownAppointments, employees, hourRange, clock)
				: buildDayColumns(query, period, shownAppointments, employees, hourRange, clock)
	};
}

function readAppointmentId(formData: FormData): string {
	return String(formData.get('appointmentId') ?? '');
}

function readQueryOfAction(url: URL): AppointmentsPageQuery {
	return parsePageQuery(url, toCalendarDay(new Date()));
}

export const actions = {
	createAppointment: async ({ request, url }) => {
		const values = readAppointmentFormValues(await request.formData());
		const formResult = validateAppointmentForm(values, await listBookableEmployees());
		if (!formResult.isValid) {
			return fail(400, { message: formResult.message, values } satisfies AppointmentsActionFailure);
		}

		const appointment = await createAppointment(formResult.newAppointment);
		const query = readQueryOfAction(url);
		redirect(
			303,
			buildPageHref(
				query,
				{ day: new Date(`${appointment.day}T00:00:00Z`) },
				{ kind: 'detail', appointmentId: appointment.id }
			)
		);
	},

	confirmAppointment: async ({ request, url }) => {
		const appointmentId = readAppointmentId(await request.formData());
		if (!(await confirmAppointment(appointmentId))) {
			return fail(409, { message: 'Ce rendez-vous n’est plus en attente : rechargez la page.' } satisfies AppointmentsActionFailure);
		}
		redirect(303, buildPageHref(readQueryOfAction(url), {}, { kind: 'detail', appointmentId }));
	},

	cancelAppointment: async ({ request, url }) => {
		const appointmentId = readAppointmentId(await request.formData());
		if (!(await cancelAppointment(appointmentId))) {
			return fail(409, { message: 'Ce rendez-vous est déjà annulé : rechargez la page.' } satisfies AppointmentsActionFailure);
		}
		redirect(303, buildPageHref(readQueryOfAction(url), {}, { kind: 'detail', appointmentId }));
	}
} satisfies Actions;
