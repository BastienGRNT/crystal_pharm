import { toMinutesSinceMidnight } from '../domain/agenda';
import type { BookableEmployee } from '../domain/appointment';
import {
	appointmentFormFieldNames,
	type AppointmentFormFieldName,
	type AppointmentFormValues
} from '../pages/appointmentsPageData';
import type { NewAppointment } from './api/appointmentsApi.server';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AppointmentFormResult =
	| { isValid: true; newAppointment: NewAppointment }
	| { isValid: false; message: string; failedFieldName: AppointmentFormFieldName | 'patientEmail' };

const missingFieldMessages: Record<AppointmentFormFieldName, string> = {
	patientName: 'Indiquez le nom du patient.',
	patientPhone: 'Indiquez son téléphone : c’est par là que vous le joindrez.',
	reason: 'Choisissez un motif.',
	employeeId: 'Choisissez qui reçoit le patient.',
	date: 'Choisissez le jour.',
	startTime: 'Choisissez l’heure de début.',
	endTime: 'Choisissez l’heure de fin.'
};

export function readAppointmentFormValues(formData: FormData): AppointmentFormValues {
	const requiredValues = Object.fromEntries(
		appointmentFormFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '').trim()])
	) as Record<AppointmentFormFieldName, string>;
	return { ...requiredValues, patientEmail: String(formData.get('patientEmail') ?? '').trim() };
}

// Seule la saisie se vérifie ici : les disponibilités et les chevauchements sont des règles du C#.
export function validateAppointmentForm(
	values: AppointmentFormValues,
	employees: readonly BookableEmployee[]
): AppointmentFormResult {
	const missingFieldName = appointmentFormFieldNames.find((fieldName) => values[fieldName] === '');
	if (missingFieldName) {
		return { isValid: false, message: missingFieldMessages[missingFieldName], failedFieldName: missingFieldName };
	}
	if (!isoDatePattern.test(values.date)) {
		return { isValid: false, message: 'Choisissez le jour dans le calendrier.', failedFieldName: 'date' };
	}
	if (!timePattern.test(values.startTime) || !timePattern.test(values.endTime)) {
		return { isValid: false, message: 'Choisissez les horaires dans les listes.', failedFieldName: 'startTime' };
	}
	if (toMinutesSinceMidnight(values.endTime) <= toMinutesSinceMidnight(values.startTime)) {
		return { isValid: false, message: 'La fin doit venir après le début.', failedFieldName: 'endTime' };
	}
	if (values.patientEmail !== '' && !emailPattern.test(values.patientEmail)) {
		return { isValid: false, message: 'Cet email ne semble pas complet : vérifiez-le, ou laissez-le vide.', failedFieldName: 'patientEmail' };
	}
	if (!employees.some((employee) => employee.id === values.employeeId)) {
		return { isValid: false, message: 'Choisissez qui reçoit le patient dans la liste.', failedFieldName: 'employeeId' };
	}
	return {
		isValid: true,
		newAppointment: {
			day: values.date,
			startTime: values.startTime,
			endTime: values.endTime,
			patientName: values.patientName,
			patientPhone: values.patientPhone,
			patientEmail: values.patientEmail === '' ? null : values.patientEmail,
			reason: values.reason,
			employeeId: values.employeeId
		}
	};
}
