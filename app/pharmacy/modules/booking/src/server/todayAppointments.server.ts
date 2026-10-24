import { sortAppointmentsByStartTime, type AppointmentStatus } from '../domain/appointment';
import { getMondayOfWeek, listWeekDays, toIsoDate } from '../domain/day';
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

export type TodayAppointments = {
	appointments: TodayAppointment[];
	/** Les rendez-vous en attente de la semaine : ceux que montre `pendingQuery`. */
	pendingCount: number;
	pendingQuery: string;
};

const toMinutesSinceMidnight = (time: string): number => {
	const [hours = 0, minutes = 0] = time.split(':').map(Number);
	return hours * 60 + minutes;
};

/** Les rendez-vous du jour (sans les annulés) et ceux qui attendent une confirmation, tels que l'accueil les résume. */
export async function getTodayAppointments(caller: BookingCaller, todayIsoDate: string): Promise<TodayAppointments> {
	const today = new Date(`${todayIsoDate}T00:00:00Z`);
	const weekDays = listWeekDays(getMondayOfWeek(today)).map(toIsoDate);
	const weekAppointments = sortAppointmentsByStartTime(await listAppointmentsOfDays(caller, weekDays));

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
		pendingCount: weekAppointments.filter((appointment) => appointment.status === 'pending').length,
		pendingQuery: `?${new URLSearchParams({ jour: todayIsoDate, vue: 'semaine', statut: statusParameters.pending })}`
	};
}
