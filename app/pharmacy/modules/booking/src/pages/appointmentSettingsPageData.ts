import type { AppointmentConfiguration } from '../domain/appointmentConfiguration';
import type { BookableEmployee } from '../domain/appointment';

export type AppointmentSettingsPageData = {
	configuration: AppointmentConfiguration;
	employees: BookableEmployee[];
};

export type AppointmentSettingsActionResult = { message: string | null; isSaved?: true };
