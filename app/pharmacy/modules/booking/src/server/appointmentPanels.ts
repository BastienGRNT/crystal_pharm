import { formatAppointmentHours, type Appointment } from '../domain/appointment';
import { formatFullDay, toIsoDate } from '../domain/day';
import type { AddAppointmentPanel, AppointmentDetailPanel } from '../pages/appointmentsPageData';
import { buildActionHref, buildPageHref, type AppointmentsPageQuery } from './appointmentsPageQuery';
import { capitalize, statusPresentations, type EmployeeDirectory } from './appointmentsPresentation';

export function buildDetailPanel(
	query: AppointmentsPageQuery,
	appointment: Appointment,
	employees: EmployeeDirectory
): AppointmentDetailPanel {
	const panel = { kind: 'detail', appointmentId: appointment.id } as const;
	const statusPresentation = statusPresentations[appointment.status];
	const employee = employees.get(appointment.employeeId);
	return {
		closeHref: buildPageHref(query),
		appointmentId: appointment.id,
		patientName: appointment.patientName,
		statusLabel: statusPresentation.label,
		statusTone: statusPresentation.badgeTone,
		items: [
			{
				label: 'Date',
				value: capitalize(formatFullDay(new Date(`${appointment.day}T00:00:00Z`))),
				detail: formatAppointmentHours(appointment)
			},
			{ label: 'Motif', value: appointment.reason },
			{ label: 'Avec', value: employee?.fullName ?? 'Employé inconnu', detail: employee?.jobTitle },
			{ label: 'Téléphone', value: appointment.patientPhone }
		],
		confirmFormAction:
			appointment.status === 'pending' ? buildActionHref(query, panel, 'confirmAppointment') : null,
		cancelFormAction:
			appointment.status === 'cancelled' ? null : buildActionHref(query, panel, 'cancelAppointment')
	};
}

export function buildAddAppointmentPanel(
	query: AppointmentsPageQuery,
	employees: EmployeeDirectory,
	reasons: readonly string[]
): AddAppointmentPanel {
	return {
		closeHref: buildPageHref(query),
		formAction: buildActionHref(query, { kind: 'add' }, 'createAppointment'),
		employeeOptions: [...employees.values()].map((employee) => ({ value: employee.id, label: employee.fullName })),
		reasonOptions: reasons.map((reason) => ({ value: reason, label: reason })),
		defaultDate: toIsoDate(query.day)
	};
}
