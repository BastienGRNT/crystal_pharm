import {
	composeAppointmentCancelledEmail,
	composeAppointmentConfirmedEmail,
	sendEmail,
	type PharmacyContact
} from '@crystal-pharm/email';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import type { Appointment } from '../domain/appointment';
import { formatFullDay, fromIsoDate } from '../domain/day';
import { confirmAppointment, findAppointment } from './api/appointmentsApi.server';
import type { BookingCaller } from './api/bookingApiClient.server';

export type AppointmentChange = 'confirmed' | 'cancelled';

async function readPharmacyContact(tenantId: string): Promise<PharmacyContact> {
	const pharmacy = await getPharmacyProfile(tenantId);
	return {
		name: pharmacy.name,
		address: `${pharmacy.street}, ${pharmacy.postalCode} ${pharmacy.city}`,
		phone: pharmacy.phoneNumber.toDisplayFormat()
	};
}

// Le jour et l'heure seulement : le motif dirait le soin, et un email n'en porte jamais.
function formatAppointmentMoment(appointment: Appointment): string {
	const [hours, minutes] = appointment.startTime.split(':');
	return `${formatFullDay(fromIsoDate(appointment.day))} à ${Number(hours)} h ${minutes}`;
}

/** Prévient le patient qui a laissé son email ; ne fait rien sinon. */
export async function notifyPatientOfAppointmentChange(
	tenantId: string,
	appointment: Appointment,
	change: AppointmentChange
): Promise<boolean> {
	if (!appointment.patientEmail) return false;
	const content = {
		to: appointment.patientEmail,
		pharmacy: await readPharmacyContact(tenantId),
		appointmentLabel: formatAppointmentMoment(appointment)
	};
	await sendEmail(
		change === 'confirmed' ? composeAppointmentConfirmedEmail(content) : composeAppointmentCancelledEmail(content)
	);
	return true;
}

/** « Confirmer » depuis l'accueil : un clic, et le patient qui a laissé son email est prévenu, comme depuis la liste. */
export async function confirmAppointmentAndNotifyPatient(caller: BookingCaller, appointmentId: string): Promise<boolean> {
	if (!(await confirmAppointment(caller, appointmentId))) return false;
	const appointment = await findAppointment(caller, appointmentId);
	if (appointment) await notifyPatientOfAppointmentChange(caller.tenantId, appointment, 'confirmed');
	return true;
}
