import { fail, redirect } from '@sveltejs/kit';
import { createGroupFromSubmission, loadGroupCreationForm } from '$lib/server/services/groups/groupForms.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => loadGroupCreationForm();

export const actions: Actions = {
	default: async ({ request }) => {
		const groupCreation = await createGroupFromSubmission(await request.formData());
		if (!groupCreation.isCreated) {
			return fail(400, { values: groupCreation.values, fieldErrors: groupCreation.fieldErrors });
		}
		const confirmation = new URLSearchParams({ cree: '1', ...(groupCreation.invitedEmail ? { invite: groupCreation.invitedEmail } : {}) });
		redirect(303, `/groupements/${groupCreation.groupId}?${confirmation}`);
	}
};
