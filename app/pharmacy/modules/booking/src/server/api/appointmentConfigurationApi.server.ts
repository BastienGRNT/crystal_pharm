import type { components } from '@crystal-pharm/api-client';
import type { AppointmentConfiguration } from '../../domain/appointmentConfiguration';
import { createBookingApiClient, type BookingCaller } from './bookingApiClient.server';

type AppointmentConfigurationDto = components['schemas']['AppointmentConfigurationDto'];

export type AppointmentConfigurationSaving = { isSaved: true } | { isSaved: false; message: string };

const toHoursAndMinutes = (timeOfDay: string): string => timeOfDay.slice(0, 5);
const toTimeOfDay = (hoursAndMinutes: string): string => `${hoursAndMinutes}:00`;

function toConfiguration(dto: AppointmentConfigurationDto): AppointmentConfiguration {
	return {
		settings: { ...dto.settings, confirmationMessage: dto.settings.confirmationMessage ?? '' },
		reasons: dto.reasons.map((reason) => ({
			...reason,
			description: reason.description ?? '',
			preparationNote: reason.preparationNote ?? ''
		})),
		weeklyAvailability: dto.weeklyAvailability.map((window) => ({
			...window,
			startTime: toHoursAndMinutes(window.startTime),
			endTime: toHoursAndMinutes(window.endTime)
		})),
		closures: dto.closures.map((closure) => ({ ...closure, label: closure.label ?? '' }))
	};
}

function toDto(configuration: AppointmentConfiguration): AppointmentConfigurationDto {
	return {
		settings: { ...configuration.settings, confirmationMessage: configuration.settings.confirmationMessage.trim() || null },
		reasons: configuration.reasons.map((reason) => ({
			...reason,
			label: reason.label.trim(),
			description: reason.description.trim() || null,
			preparationNote: reason.preparationNote.trim() || null
		})),
		weeklyAvailability: configuration.weeklyAvailability.map((window) => ({
			...window,
			startTime: toTimeOfDay(window.startTime),
			endTime: toTimeOfDay(window.endTime)
		})),
		closures: configuration.closures.map((closure) => ({ ...closure, label: closure.label.trim() || null }))
	};
}

export async function getAppointmentConfiguration(caller: BookingCaller): Promise<AppointmentConfiguration> {
	const { data, response } = await createBookingApiClient(caller).GET('/booking/configuration');
	if (!data) throw new Error(`The booking API refused the reading of the configuration with status ${response.status}.`);
	return toConfiguration(data);
}

export async function saveAppointmentConfiguration(
	caller: BookingCaller,
	configuration: AppointmentConfiguration
): Promise<AppointmentConfigurationSaving> {
	const { error, response } = await createBookingApiClient(caller).PUT('/booking/configuration', {
		body: toDto(configuration)
	});
	if (response.ok) return { isSaved: true };
	// Le C# ne renvoie que des messages fixes, jamais la saisie.
	if (response.status === 400 && error?.detail) return { isSaved: false, message: error.detail };
	throw new Error(`The booking API refused the saving of the configuration with status ${response.status}.`);
}
