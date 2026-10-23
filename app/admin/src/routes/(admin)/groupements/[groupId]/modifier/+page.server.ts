import { error, fail, redirect } from '@sveltejs/kit';
import { loadGroupEditionForm, updateGroupFromSubmission } from '$lib/server/services/groups/groupForms.server';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const groupEditionForm = await loadGroupEditionForm(params.groupId);
	if (!groupEditionForm) error(404, 'Ce groupement n’existe pas.');
	return groupEditionForm;
};

export const actions: Actions = {
	default: async ({ params, request }) => {
		const groupUpdate = await updateGroupFromSubmission(params.groupId, await request.formData());
		if (!groupUpdate.isSaved) return fail(400, { values: groupUpdate.values, fieldErrors: groupUpdate.fieldErrors });
		redirect(303, `/groupements/${params.groupId}?modifie=1`);
	}
};
