import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail } from '@sveltejs/kit';
import type { AppointmentSettingsActionResult, AppointmentSettingsPageData } from '../pages/appointmentSettingsPageData';
import { getAppointmentConfiguration, saveAppointmentConfiguration } from './api/appointmentConfigurationApi.server';
import { listBookableEmployees } from './api/appointmentsApi.server';
import { readAppointmentConfigurationForm } from './appointmentConfigurationForm';
import { requireBookingCaller } from './bookingCaller.server';

type SettingsRequest = { locals: { user: AuthenticatedUser | null } };

export async function load({ locals }: SettingsRequest): Promise<AppointmentSettingsPageData> {
	const caller = await requireBookingCaller(locals.user);
	const [configuration, employees] = await Promise.all([getAppointmentConfiguration(caller), listBookableEmployees(caller)]);
	return { configuration, employees };
}

export const actions = {
	saveConfiguration: async ({ request, locals }: SettingsRequest & { request: Request }) => {
		const caller = await requireBookingCaller(locals.user);
		const reading = readAppointmentConfigurationForm(await request.formData());
		if (!reading.isValid) return fail(400, { message: reading.message } satisfies AppointmentSettingsActionResult);

		const saving = await saveAppointmentConfiguration(caller, reading.configuration);
		if (!saving.isSaved) return fail(400, { message: saving.message } satisfies AppointmentSettingsActionResult);
		return { message: null, isSaved: true } satisfies AppointmentSettingsActionResult;
	}
};
