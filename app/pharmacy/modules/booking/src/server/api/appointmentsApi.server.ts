import type { components } from '@crystal-pharm/api-client';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import { listEmployees } from '@crystal-pharm/pharmacy-db';
import type { Appointment, BookableEmployee } from '../../domain/appointment';
import { createBookingApiClient, type BookingCaller } from './bookingApiClient.server';

export type NewAppointment = Omit<Appointment, 'id' | 'status'>;

export type AppointmentCreation = { isCreated: true; appointment: Appointment } | { isCreated: false; message: string };

type AppointmentDto = components['schemas']['AppointmentDto'];

const appointmentReasons: readonly string[] = [
	'Vaccination',
	'Test antigénique',
	'Entretien pharmaceutique',
	'Bilan de médication',
	'Retrait de commande',
	'Autre'
];

// Le C# écrit une heure en « 08:45:00 » ; le module, comme le design system, en « 08:45 ».
const toHoursAndMinutes = (timeOfDay: string): string => timeOfDay.slice(0, 5);
const toTimeOfDay = (hoursAndMinutes: string): string => `${hoursAndMinutes}:00`;

function toAppointment(appointmentDto: AppointmentDto): Appointment {
	return {
		id: appointmentDto.id,
		day: appointmentDto.day,
		startTime: toHoursAndMinutes(appointmentDto.startTime),
		endTime: toHoursAndMinutes(appointmentDto.endTime),
		patientName: appointmentDto.patientName,
		patientPhone: appointmentDto.patientPhone,
		reason: appointmentDto.reason,
		employeeId: appointmentDto.employeeId,
		status: appointmentDto.status
	};
}

// Ni l'URL ni la réponse dans le message : elles peuvent contenir des données de santé.
function unexpectedResponse(operation: string, response: Response): Error {
	return new Error(`The booking API refused ${operation} with status ${response.status}.`);
}

export async function listAppointmentReasons(): Promise<string[]> {
	return [...appointmentReasons];
}

export async function listBookableEmployees(caller: BookingCaller): Promise<BookableEmployee[]> {
	const employees = await listEmployees(caller.tenantId);
	return employees.map((employee) => ({
		id: employee.employeeId,
		fullName: formatEmployeeFullName(employee),
		jobTitle: employee.jobTitle.toDisplayFormat()
	}));
}

export async function listAppointmentsOfDays(caller: BookingCaller, isoDays: readonly string[]): Promise<Appointment[]> {
	const { data, response } = await createBookingApiClient(caller).GET('/booking/appointments', {
		params: { query: { day: [...isoDays] } }
	});
	if (!data) throw unexpectedResponse('the listing of appointments', response);
	return data.map(toAppointment);
}

export async function findAppointment(caller: BookingCaller, appointmentId: string): Promise<Appointment | undefined> {
	const { data, response } = await createBookingApiClient(caller).GET('/booking/appointments/{appointmentId}', {
		params: { path: { appointmentId } }
	});
	if (response.status === 404) return undefined;
	if (!data) throw unexpectedResponse('the reading of an appointment', response);
	return toAppointment(data);
}

export async function createAppointment(caller: BookingCaller, newAppointment: NewAppointment): Promise<AppointmentCreation> {
	const { data, error, response } = await createBookingApiClient(caller).POST('/booking/appointments', {
		body: {
			...newAppointment,
			startTime: toTimeOfDay(newAppointment.startTime),
			endTime: toTimeOfDay(newAppointment.endTime)
		}
	});
	if (data) return { isCreated: true, appointment: toAppointment(data) };
	// Le C# ne renvoie que des messages fixes, jamais la saisie : on peut les montrer tels quels.
	if ((response.status === 400 || response.status === 409) && error?.detail) return { isCreated: false, message: error.detail };
	throw unexpectedResponse('the scheduling of an appointment', response);
}

export async function confirmAppointment(caller: BookingCaller, appointmentId: string): Promise<boolean> {
	const { response } = await createBookingApiClient(caller).POST('/booking/appointments/{appointmentId}/confirm', {
		params: { path: { appointmentId } }
	});
	return response.ok;
}

export async function cancelAppointment(caller: BookingCaller, appointmentId: string): Promise<boolean> {
	const { response } = await createBookingApiClient(caller).POST('/booking/appointments/{appointmentId}/cancel', {
		params: { path: { appointmentId } }
	});
	return response.ok;
}
