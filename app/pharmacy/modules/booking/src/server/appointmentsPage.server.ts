import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail, redirect, type Actions } from '@sveltejs/kit';
import {
	countAppointmentsByStatus,
	filterAppointmentsByStatus,
	sortAppointmentsByStartTime,
	type Appointment
} from '../domain/appointment';
import { fromIsoDate, toCalendarDay, toIsoDate } from '../domain/day';
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
} from './api/appointmentsApi.server';
import type { BookingCaller } from './api/bookingApiClient.server';
import { readAppointmentFormValues, validateAppointmentForm } from './appointmentForm';
import { buildAddAppointmentPanel, buildDetailPanel } from './appointmentPanels';
import { requireBookingCaller } from './bookingCaller.server';
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

async function loadEmployeeDirectory(caller: BookingCaller): Promise<EmployeeDirectory> {
	const employees = await listBookableEmployees(caller);
	return new Map(employees.map((employee) => [employee.id, employee]));
}

async function buildPanels(
	caller: BookingCaller,
	url: URL,
	query: AppointmentsPageQuery,
	employees: EmployeeDirectory
): Promise<Pick<CommonAppointmentsPageData, 'detailPanel' | 'addAppointmentPanel'>> {
	const panel = parsePanel(url);
	if (panel.kind === 'add') {
		return { detailPanel: null, addAppointmentPanel: buildAddAppointmentPanel(query, employees, await listAppointmentReasons(caller)) };
	}
	const appointment = panel.kind === 'detail' ? await findAppointment(caller, panel.appointmentId) : undefined;
	return {
		detailPanel: appointment ? buildDetailPanel(query, appointment, employees) : null,
		addAppointmentPanel: null
	};
}

type AppointmentsRequest = {
	url: URL;
	locals: { user: AuthenticatedUser | null };
};

export async function load({ url, locals }: AppointmentsRequest): Promise<AppointmentsPageData> {
	const caller = await requireBookingCaller(locals.user);
	const now = new Date();
	const clock: AgendaClock = { today: toCalendarDay(now), now };
	const query = parsePageQuery(url, clock.today);
	const period = buildPeriod(query);
	const employees = await loadEmployeeDirectory(caller);

	const appointmentsOfPeriod = sortAppointmentsByStartTime(await listAppointmentsOfDays(caller, period.days.map(toIsoDate)));
	const counts = countAppointmentsByStatus(appointmentsOfPeriod);
	const shownAppointments: Appointment[] = filterAppointmentsByStatus(appointmentsOfPeriod, query.statusFilter);

	const commonData: CommonAppointmentsPageData = {
		context: buildContext(period, counts),
		viewOptions: buildViewOptions(query),
		periodNavigation: buildPeriodNavigation(query, clock.today),
		statusTabs: buildStatusTabs(query, counts),
		addAppointmentHref: buildPageHref(query, {}, { kind: 'add' }),
		emptyState: buildEmptyState(query, period),
		...(await buildPanels(caller, url, query, employees))
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
	createAppointment: async ({ request, url, locals }) => {
		const caller = await requireBookingCaller(locals.user);
		const values = readAppointmentFormValues(await request.formData());
		const formResult = validateAppointmentForm(values, await listBookableEmployees(caller));
		if (!formResult.isValid) {
			return fail(400, { message: formResult.message, values } satisfies AppointmentsActionFailure);
		}

		const creation = await createAppointment(caller, formResult.newAppointment);
		if (!creation.isCreated) {
			return fail(400, { message: creation.message, values } satisfies AppointmentsActionFailure);
		}
		const { appointment } = creation;
		redirect(
			303,
			buildPageHref(
				readQueryOfAction(url),
				{ day: fromIsoDate(appointment.day) },
				{ kind: 'detail', appointmentId: appointment.id }
			)
		);
	},

	confirmAppointment: async ({ request, url, locals }) => {
		const caller = await requireBookingCaller(locals.user);
		const appointmentId = readAppointmentId(await request.formData());
		if (!(await confirmAppointment(caller, appointmentId))) {
			return fail(409, { message: 'Ce rendez-vous n’est plus en attente : rechargez la page.' } satisfies AppointmentsActionFailure);
		}
		redirect(303, buildPageHref(readQueryOfAction(url), {}, { kind: 'detail', appointmentId }));
	},

	cancelAppointment: async ({ request, url, locals }) => {
		const caller = await requireBookingCaller(locals.user);
		const appointmentId = readAppointmentId(await request.formData());
		if (!(await cancelAppointment(caller, appointmentId))) {
			return fail(409, { message: 'Ce rendez-vous est déjà annulé : rechargez la page.' } satisfies AppointmentsActionFailure);
		}
		redirect(303, buildPageHref(readQueryOfAction(url), {}, { kind: 'detail', appointmentId }));
	}
} satisfies Actions;
