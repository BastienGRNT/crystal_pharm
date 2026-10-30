import { toMinutesSinceMidnight } from '../domain/agenda';
import { sortAppointmentsByStartTime, type AppointmentStatus } from '../domain/appointment';
import { fromIsoDate, getMondayOfWeek, listWeekDays, toIsoDate } from '../domain/day';
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

/** Un rendez-vous de la semaine qui attend sa confirmation. */
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
	/** Les rendez-vous en attente de la semaine : ceux que montre `pendingQuery`. */
	pendingCount: number;
	pendingQuery: string;
	/** Le formulaire d'un nouveau rendez-vous. */
	newAppointmentQuery: string;
};

/** Les rendez-vous du jour (sans les annulés) et ceux qui attendent une confirmation, tels que l'accueil les résume. */
export async function getTodayAppointments(caller: BookingCaller, todayIsoDate: string): Promise<TodayAppointments> {
	const weekDays = listWeekDays(getMondayOfWeek(fromIsoDate(todayIsoDate))).map(toIsoDate);
	const weekAppointments = sortAppointmentsByStartTime(await listAppointmentsOfDays(caller, weekDays));
	const pendingAppointments = weekAppointments.filter((appointment) => appointment.status === 'pending');

	return {
		appointments: weekAppointments.flatMap((appointment) =>
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
		pendingQuery: `?${new URLSearchParams({ jour: todayIsoDate, vue: 'semaine', statut: statusParameters.pending })}`,
		newAppointmentQuery: `?${new URLSearchParams({ jour: todayIsoDate, nouveau: '1' })}`
	};
}
