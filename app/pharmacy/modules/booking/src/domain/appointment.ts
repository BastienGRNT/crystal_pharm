export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled';

export type Appointment = {
	id: string;
	/** Le jour, au format AAAA-MM-JJ. */
	day: string;
	startTime: string;
	endTime: string;
	patientName: string;
	patientPhone: string;
	reason: string;
	employeeId: string;
	status: AppointmentStatus;
	/** Le mot laissé par le patient en réservant ; vide si rien. */
	note: string;
};

export type BookableEmployee = {
	id: string;
	fullName: string;
	jobTitle: string;
};

export type AppointmentStatusFilter = AppointmentStatus | 'all';

export type AppointmentCountsByStatus = Record<AppointmentStatusFilter, number>;

export const appointmentStatuses: readonly AppointmentStatus[] = ['pending', 'confirmed', 'cancelled'];

export function sortAppointmentsByStartTime(appointments: readonly Appointment[]): Appointment[] {
	return [...appointments].sort(
		(first, second) => first.day.localeCompare(second.day) || first.startTime.localeCompare(second.startTime)
	);
}

export function listAppointmentsOfDay(appointments: readonly Appointment[], isoDay: string): Appointment[] {
	return appointments.filter((appointment) => appointment.day === isoDay);
}

export function listAppointmentsOfEmployee(appointments: readonly Appointment[], employeeId: string): Appointment[] {
	return appointments.filter((appointment) => appointment.employeeId === employeeId);
}

export function filterAppointmentsByStatus(
	appointments: readonly Appointment[],
	statusFilter: AppointmentStatusFilter
): Appointment[] {
	if (statusFilter === 'all') return [...appointments];
	return appointments.filter((appointment) => appointment.status === statusFilter);
}

export function countAppointmentsByStatus(appointments: readonly Appointment[]): AppointmentCountsByStatus {
	const counts: AppointmentCountsByStatus = { all: appointments.length, pending: 0, confirmed: 0, cancelled: 0 };
	for (const appointment of appointments) counts[appointment.status] += 1;
	return counts;
}

/** « 08:30–09:00 », le format horaire du design system. */
export function formatAppointmentHours(appointment: Appointment): string {
	return `${appointment.startTime}–${appointment.endTime}`;
}
