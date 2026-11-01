import { toMinutesSinceMidnight } from '../domain/agenda';
import { sortAppointmentsByStartTime, type AppointmentStatus } from '../domain/appointment';
import { addDays, fromIsoDate, getMondayOfWeek, listWeekDays, toIsoDate } from '../domain/day';
import { listAppointmentsOfDays } from './api/appointmentsApi.server';
import type { BookingCaller } from './api/bookingApiClient.server';
import { statusParameters } from './appointmentsPageQuery';

export type TodayAppointment = {
	id: string;
	startMinutes: number;
	endMinutes: number;
	/** « 09:30 ». */
	startTime: string;
	/** Le motif seulement : l'accueil ne montre jamais le patient. */
	reason: string;
	status: Exclude<AppointmentStatus, 'cancelled'>;
	/** La fiche du rendez-vous, relative au module : `?jour=2026-10-24&rdv=<uuid>`. */
	detailQuery: string;
};

/** Un rendez-vous de cette semaine ou de la suivante qui attend sa confirmation. */
export type PendingAppointment = {
	id: string;
	/** Le jour, au format AAAA-MM-JJ. */
	day: string;
	startTime: string;
	reason: string;
	detailQuery: string;
};

export type TodayAppointments = {
	appointments: TodayAppointment[];
	/** Dans l'ordre de la semaine. */
	pendingAppointments: PendingAppointment[];
	/** Les rendez-vous en attente sur les deux semaines : `pendingQuery` montre la semaine du premier. */
	pendingCount: number;
	pendingQuery: string;
	/** Le formulaire d'un nouveau rendez-vous. */
	newAppointmentQuery: string;
};

/** Les rendez-vous du jour (sans les annulés) et ceux qui attendent une confirmation, tels que l'accueil les résume. */
export async function getTodayAppointments(caller: BookingCaller, todayIsoDate: string): Promise<TodayAppointments> {
	// Deux semaines : une demande du lundi suivant, envoyée le vendredi, s'attend dès le week-end.
	const monday = getMondayOfWeek(fromIsoDate(todayIsoDate));
	const days = [...listWeekDays(monday), ...listWeekDays(addDays(monday, 7))].map(toIsoDate);
	const appointmentsOfTwoWeeks = sortAppointmentsByStartTime(await listAppointmentsOfDays(caller, days));
	const pendingAppointments = appointmentsOfTwoWeeks.filter(
		(appointment) => appointment.status === 'pending' && appointment.day >= todayIsoDate
	);

	return {
		appointments: appointmentsOfTwoWeeks.flatMap((appointment) =>
			appointment.day === todayIsoDate && appointment.status !== 'cancelled'
				? [
						{
							id: appointment.id,
							startMinutes: toMinutesSinceMidnight(appointment.startTime),
							endMinutes: toMinutesSinceMidnight(appointment.endTime),
							startTime: appointment.startTime,
							reason: appointment.reason,
							status: appointment.status,
							detailQuery: `?${new URLSearchParams({ jour: todayIsoDate, rdv: appointment.id })}`
						}
					]
				: []
		),
		pendingAppointments: pendingAppointments.map((appointment) => ({
			id: appointment.id,
			day: appointment.day,
			startTime: appointment.startTime,
			reason: appointment.reason,
			detailQuery: `?${new URLSearchParams({ jour: appointment.day, rdv: appointment.id })}`
		})),
		pendingCount: pendingAppointments.length,
		pendingQuery: `?${new URLSearchParams({
			jour: pendingAppointments[0]?.day ?? todayIsoDate,
			vue: 'semaine',
			statut: statusParameters.pending
		})}`,
		newAppointmentQuery: `?${new URLSearchParams({ jour: todayIsoDate, nouveau: '1' })}`
	};
}
