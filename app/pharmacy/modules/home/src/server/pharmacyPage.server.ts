import type { AuthenticatedUser } from '@crystal-pharm/auth';
import {
	getPharmacyProfile,
	updatePharmacyContactDetails,
	updateWeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import type {
	ContactDetailsFailure,
	OpeningHoursFailure,
	PharmacyPageData,
	PharmacySectionSaved
} from '../pages/pharmacyPageData';
import { requireActiveTenantId } from './activeTenant.server';
import { openingHoursRefusedMessage } from './onboarding/openingHoursStep.server';
import { readContactDetailsInput, readWeeklyOpeningScheduleInput } from './pharmacyFormSubmissions.server';

export async function loadPharmacyPage({
	locals
}: {
	locals: { user: AuthenticatedUser | null };
}): Promise<PharmacyPageData> {
	const pharmacyProfile = await getPharmacyProfile(await requireActiveTenantId(locals.user));
	return {
		contactDetails: {
			name: pharmacyProfile.name,
			street: pharmacyProfile.street,
			postalCode: pharmacyProfile.postalCode,
			city: pharmacyProfile.city,
			phoneNumber: pharmacyProfile.phoneNumber.toDisplayFormat(),
			email: pharmacyProfile.email ?? ''
		},
		weeklyOpeningSchedule: pharmacyProfile.weeklyOpeningSchedule
	};
}

export const pharmacyPageActions = {
	contactDetails: async ({
		locals,
		request
	}: RequestEvent): Promise<PharmacySectionSaved | ActionFailure<ContactDetailsFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const submittedContactDetails = readContactDetailsInput(await request.formData());
		const contactDetailsUpdate = await updatePharmacyContactDetails(tenantId, submittedContactDetails);
		if (!contactDetailsUpdate.isSaved) {
			return fail(400, {
				failedSection: 'contactDetails',
				submittedContactDetails,
				fieldErrors: contactDetailsUpdate.fieldErrors
			});
		}
		return { savedSection: 'contactDetails' };
	},

	openingHours: async ({
		locals,
		request
	}: RequestEvent): Promise<PharmacySectionSaved | ActionFailure<OpeningHoursFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const scheduleUpdate = await updateWeeklyOpeningSchedule(
			tenantId,
			readWeeklyOpeningScheduleInput(await request.formData())
		);
		if (!scheduleUpdate.isSaved) {
			return fail(400, { failedSection: 'openingHours', failureMessage: openingHoursRefusedMessage });
		}
		return { savedSection: 'openingHours' };
	}
};
