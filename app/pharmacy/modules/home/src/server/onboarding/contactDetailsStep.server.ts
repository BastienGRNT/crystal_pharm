import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { createTenantForAccount, findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { homePathnames } from '../../homePathnames';
import type { ContactDetailsFailure } from '../../pages/pharmacyPageData';
import { requireSignedInAccountId } from '../activeTenant.server';
import { readContactDetailsInput } from '../pharmacyFormSubmissions.server';

async function continueIfPharmacyAlreadyCreated(accountId: string): Promise<void> {
	if (await findActiveTenantIdOfAccount(accountId)) redirect(303, homePathnames.openingHoursStep);
}

export async function loadContactDetailsStep({ locals }: { locals: { user: AuthenticatedUser | null } }): Promise<void> {
	await continueIfPharmacyAlreadyCreated(requireSignedInAccountId(locals.user));
}

export const contactDetailsStepActions = {
	default: async ({ locals, request }: RequestEvent): Promise<ActionFailure<ContactDetailsFailure>> => {
		const accountId = requireSignedInAccountId(locals.user);
		// Un second envoi du même formulaire (double clic, retour arrière) ne crée pas une seconde pharmacie.
		await continueIfPharmacyAlreadyCreated(accountId);

		const submittedContactDetails = readContactDetailsInput(await request.formData());
		const tenantCreation = await createTenantForAccount(accountId, submittedContactDetails);
		if (!tenantCreation.isSaved) {
			return fail(400, { failedSection: 'contactDetails', submittedContactDetails, fieldErrors: tenantCreation.fieldErrors });
		}
		redirect(303, homePathnames.openingHoursStep);
	}
};
