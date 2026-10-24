import { toMinutesSinceMidnight } from '../domain/agenda';
import type { BookableEmployee } from '../domain/appointment';
import {
	appointmentFormFieldNames,
	type AppointmentFormValues
} from '../pages/appointmentsPageData';
import type { NewAppointment } from './api/appointmentsApi.server';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export type AppointmentFormResult =
	| { isValid: true; newAppointment: NewAppointment }
	| { isValid: false; message: string };

export function readAppointmentFormValues(formData: FormData): AppointmentFormValues {
	return Object.fromEntries(
		appointmentFormFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '').trim()])
	) as AppointmentFormValues;
}

// Seule la saisie se vérifie ici : les disponibilités et les chevauchements sont des règles du C#.
export function validateAppointmentForm(
	values: AppointmentFormValues,
	employees: readonly BookableEmployee[]
): AppointmentFormResult {
	if (appointmentFormFieldNames.some((fieldName) => values[fieldName] === '')) {
		return { isValid: false, message: 'Renseignez le patient, son téléphone, le motif, l’employé, le jour et les horaires.' };
	}
	if (!isoDatePattern.test(values.date) || !timePattern.test(values.startTime) || !timePattern.test(values.endTime)) {
		return { isValid: false, message: 'Choisissez le jour et les horaires dans les listes.' };
	}
	if (toMinutesSinceMidnight(values.endTime) <= toMinutesSinceMidnight(values.startTime)) {
		return { isValid: false, message: 'L’heure de fin doit suivre l’heure de début.' };
	}
	if (!employees.some((employee) => employee.id === values.employeeId)) {
		return { isValid: false, message: 'Choisissez un employé dans la liste.' };
	}
	return {
		isValid: true,
		newAppointment: {
			day: values.date,
			startTime: values.startTime,
			endTime: values.endTime,
			patientName: values.patientName,
			patientPhone: values.patientPhone,
			reason: values.reason,
			employeeId: values.employeeId
		}
	};
}
