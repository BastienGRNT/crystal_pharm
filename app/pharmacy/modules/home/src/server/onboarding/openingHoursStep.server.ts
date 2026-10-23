import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getPharmacyProfile, updateWeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db';
import { fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { homePathnames } from '../../homePathnames';
import type { OpeningHoursFailure } from '../../pages/pharmacy/pharmacyPageData';
import { requireActiveTenantId } from '../activeTenant.server';
import { readWeeklyOpeningScheduleInput } from '../pharmacy/pharmacyFormSubmissions.server';

export const openingHoursRefusedMessage = 'Ces horaires n’ont pas pu être enregistrés : vérifiez-les puis réessayez.';

export async function loadOpeningHoursStep({ locals }: { locals: { user: AuthenticatedUser | null } }): Promise<void> {
	const { weeklyOpeningSchedule } = await getPharmacyProfile(await requireActiveTenantId(locals.user));
	if (weeklyOpeningSchedule) redirect(303, homePathnames.toolsHome);
}

export const openingHoursStepActions = {
	default: async ({ locals, request }: RequestEvent): Promise<ActionFailure<OpeningHoursFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const scheduleUpdate = await updateWeeklyOpeningSchedule(
			tenantId,
			readWeeklyOpeningScheduleInput(await request.formData())
		);
		if (!scheduleUpdate.isSaved) {
			return fail(400, { failedSection: 'openingHours', failureMessage: openingHoursRefusedMessage });
		}
		redirect(303, homePathnames.toolsHome);
	}
};
