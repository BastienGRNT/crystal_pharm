import { getPharmacyGroupProfile, updatePharmacyGroupProfile } from '@crystal-pharm/group-db';
import {
	pharmacyGroupImageFields,
	pharmacyGroupProfileTextFieldNames,
	type PharmacyGroupImageChange,
	type PharmacyGroupImageChanges,
	type PharmacyGroupImageKind,
	type PharmacyGroupProfileFieldName,
	type PharmacyGroupProfileInput
} from '@crystal-pharm/group-db/domain';
import type { FieldErrors } from '@crystal-pharm/pharmacy-db/domain';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { pharmacyGroupImagePathname } from '$lib/groupPathnames';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

export type GroupProfilePageData = {
	profile: PharmacyGroupProfileInput;
	/** `undefined` sans image. */
	imageUrls: Record<PharmacyGroupImageKind, string | undefined>;
};

export type GroupProfileSaved = { isSaved: true };

export type GroupProfileFailure = {
	submittedProfile: PharmacyGroupProfileInput;
	fieldErrors: FieldErrors<PharmacyGroupProfileFieldName>;
};

export async function loadGroupProfilePage({ locals }: { locals: App.Locals }): Promise<GroupProfilePageData> {
	const profile = await getPharmacyGroupProfile(await requireActiveGroupId(locals.user));
	return {
		profile: {
			name: profile.name,
			loyaltyCardUrl: profile.loyaltyCardUrl ?? '',
			loyaltyCardMessage: profile.loyaltyCardMessage ?? ''
		},
		imageUrls: {
			logo: profile.logoId && pharmacyGroupImagePathname(profile.logoId),
			loyaltyCardImage: profile.loyaltyCardImageId && pharmacyGroupImagePathname(profile.loyaltyCardImageId)
		}
	};
}

export const groupProfilePageActions = {
	default: async ({ locals, request }: RequestEvent): Promise<GroupProfileSaved | ActionFailure<GroupProfileFailure>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const formData = await request.formData();
		const submittedProfile = readProfileInput(formData);
		const profileUpdate = await updatePharmacyGroupProfile(groupId, submittedProfile, readImageChanges(formData));
		if (!profileUpdate.isSaved) return fail(400, { submittedProfile, fieldErrors: profileUpdate.fieldErrors });
		return { isSaved: true };
	}
};

function readProfileInput(formData: FormData): PharmacyGroupProfileInput {
	return Object.fromEntries(
		pharmacyGroupProfileTextFieldNames.map((fieldName) => [fieldName, readText(formData, fieldName)])
	) as PharmacyGroupProfileInput;
}

function readImageChanges(formData: FormData): PharmacyGroupImageChanges {
	return {
		logo: readImageChange(formData, 'logo'),
		loyaltyCardImage: readImageChange(formData, 'loyaltyCardImage')
	};
}

/** Un fichier choisi remplace l'image ; sans fichier, elle reste, sauf si elle a été retirée. */
function readImageChange(formData: FormData, imageKind: PharmacyGroupImageKind): PharmacyGroupImageChange {
	const { fieldName, removalFieldName } = pharmacyGroupImageFields[imageKind];
	const upload = formData.get(fieldName);
	if (upload instanceof Blob && upload.size > 0) return { kind: 'replaced', upload };
	return readText(formData, removalFieldName) === 'true' ? { kind: 'removed' } : { kind: 'unchanged' };
}

function readText(formData: FormData, fieldName: string): string {
	const value = formData.get(fieldName);
	return typeof value === 'string' ? value : '';
}
