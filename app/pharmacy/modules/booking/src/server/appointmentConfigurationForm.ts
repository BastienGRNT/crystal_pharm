import type { AppointmentConfiguration } from '../domain/appointmentConfiguration';

export type AppointmentConfigurationFormReading =
	| { isValid: true; configuration: AppointmentConfiguration }
	| { isValid: false; message: string };

const unreadableConfiguration = { isValid: false, message: 'Les réglages n’ont pas pu être lus : rechargez la page.' } as const;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** La forme seulement ; les règles (durées, plages, dates) sont revérifiées par le C#. */
function hasExpectedShape(value: unknown): value is AppointmentConfiguration {
	return (
		isRecord(value) &&
		isRecord(value.settings) &&
		Array.isArray(value.reasons) &&
		Array.isArray(value.weeklyAvailability) &&
		Array.isArray(value.closures)
	);
}

export function readAppointmentConfigurationForm(formData: FormData): AppointmentConfigurationFormReading {
	try {
		const configuration: unknown = JSON.parse(String(formData.get('configuration') ?? ''));
		return hasExpectedShape(configuration) ? { isValid: true, configuration } : unreadableConfiguration;
	} catch {
		return unreadableConfiguration;
	}
}
