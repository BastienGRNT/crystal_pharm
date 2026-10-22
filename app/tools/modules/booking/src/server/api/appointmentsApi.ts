import type { Appointment, BookableEmployee } from '../../domain/appointment';

// Provisoire : le module Booking du C# n'existe pas encore, ni shared/pharmacy pour les noms des
// Employees. Ce faux stock en mémoire, perdu au redémarrage, laisse voir et essayer la page ;
// ce fichier appellera shared/api-client à la place, avec les mêmes signatures.

export type NewAppointment = Omit<Appointment, 'id' | 'status'>;

const bookableEmployees: readonly BookableEmployee[] = [
	{ id: 'employee-lea', fullName: 'Léa Martin', jobTitle: 'Pharmacien adjoint' },
	{ id: 'employee-thomas', fullName: 'Thomas Petit', jobTitle: 'Préparateur' },
	{ id: 'employee-sarah', fullName: 'Sarah Roux', jobTitle: 'Titulaire' }
];

type SampleAppointment = Omit<Appointment, 'id' | 'day'>;

const sampleAppointmentsOfDay: readonly SampleAppointment[] = [
	{
		startTime: '08:45',
		endTime: '09:00',
		patientName: 'Camille Durand',
		patientPhone: '06 12 34 56 78',
		reason: 'Vaccination',
		employeeId: 'employee-lea',
		status: 'confirmed'
	},
	{
		startTime: '09:30',
		endTime: '09:45',
		patientName: 'Hugo Bernard',
		patientPhone: '06 98 76 54 32',
		reason: 'Test antigénique',
		employeeId: 'employee-thomas',
		status: 'pending'
	},
	{
		startTime: '10:15',
		endTime: '10:45',
		patientName: 'Nadia Lefebvre',
		patientPhone: '07 11 22 33 44',
		reason: 'Entretien pharmaceutique',
		employeeId: 'employee-sarah',
		status: 'confirmed'
	},
	{
		startTime: '10:30',
		endTime: '10:45',
		patientName: 'Paul Moreau',
		patientPhone: '06 55 44 33 22',
		reason: 'Vaccination',
		employeeId: 'employee-lea',
		status: 'cancelled'
	},
	{
		startTime: '14:30',
		endTime: '14:45',
		patientName: 'Inès Girard',
		patientPhone: '06 01 02 03 04',
		reason: 'Retrait de commande',
		employeeId: 'employee-thomas',
		status: 'pending'
	},
	{
		startTime: '16:00',
		endTime: '16:30',
		patientName: 'Louis Fontaine',
		patientPhone: '07 66 77 88 99',
		reason: 'Bilan de médication',
		employeeId: 'employee-sarah',
		status: 'confirmed'
	},
	{
		startTime: '17:15',
		endTime: '17:30',
		patientName: 'Emma Lambert',
		patientPhone: '06 21 43 65 87',
		reason: 'Test antigénique',
		employeeId: 'employee-lea',
		status: 'pending'
	}
];

const sundayIndex = 0;
const appointmentsByDay = new Map<string, Appointment[]>();

/** Chaque jour reçoit une partie des exemples, différente selon le jour de la semaine. */
function createSampleAppointmentsOfDay(isoDay: string): Appointment[] {
	const weekdayIndex = new Date(`${isoDay}T00:00:00Z`).getUTCDay();
	if (weekdayIndex === sundayIndex) return [];
	return sampleAppointmentsOfDay
		.filter((_, sampleIndex) => (sampleIndex + weekdayIndex) % 3 !== 0)
		.map((sample) => ({ ...sample, id: crypto.randomUUID(), day: isoDay }));
}

function getStoredAppointmentsOfDay(isoDay: string): Appointment[] {
	let appointmentsOfDay = appointmentsByDay.get(isoDay);
	if (!appointmentsOfDay) {
		appointmentsOfDay = createSampleAppointmentsOfDay(isoDay);
		appointmentsByDay.set(isoDay, appointmentsOfDay);
	}
	return appointmentsOfDay;
}

function findStoredAppointment(appointmentId: string): Appointment | undefined {
	for (const appointmentsOfDay of appointmentsByDay.values()) {
		const appointment = appointmentsOfDay.find(({ id }) => id === appointmentId);
		if (appointment) return appointment;
	}
	return undefined;
}

const appointmentReasons: readonly string[] = [
	'Vaccination',
	'Test antigénique',
	'Entretien pharmaceutique',
	'Bilan de médication',
	'Retrait de commande',
	'Autre'
];

export async function listAppointmentReasons(): Promise<string[]> {
	return [...appointmentReasons];
}

export async function listBookableEmployees(): Promise<BookableEmployee[]> {
	return [...bookableEmployees];
}

export async function listAppointmentsOfDays(isoDays: readonly string[]): Promise<Appointment[]> {
	return isoDays.flatMap((isoDay) => getStoredAppointmentsOfDay(isoDay).map((appointment) => ({ ...appointment })));
}

export async function findAppointment(appointmentId: string): Promise<Appointment | undefined> {
	const appointment = findStoredAppointment(appointmentId);
	return appointment ? { ...appointment } : undefined;
}

export async function createAppointment(newAppointment: NewAppointment): Promise<Appointment> {
	const appointment: Appointment = { ...newAppointment, id: crypto.randomUUID(), status: 'pending' };
	getStoredAppointmentsOfDay(appointment.day).push(appointment);
	return { ...appointment };
}

export async function confirmAppointment(appointmentId: string): Promise<boolean> {
	const appointment = findStoredAppointment(appointmentId);
	if (!appointment || appointment.status !== 'pending') return false;
	appointment.status = 'confirmed';
	return true;
}

export async function cancelAppointment(appointmentId: string): Promise<boolean> {
	const appointment = findStoredAppointment(appointmentId);
	if (!appointment || appointment.status === 'cancelled') return false;
	appointment.status = 'cancelled';
	return true;
}
