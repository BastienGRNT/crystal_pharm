import {
	getGroupContract,
	getToolCatalog,
	listFlatRateOffers,
	platformBillingAccess,
	saveGroupContract,
	validateGroupContractInput,
	type FlatRateOffer,
	type GroupContractInput
} from '@crystal-pharm/billing-db';
import { formatCentsForInput, type ToolCatalog } from '@crystal-pharm/billing-db/domain';
import { createPharmacyGroup, getPharmacyGroupForPlatform, updatePharmacyGroup } from '@crystal-pharm/group-db';
import { PharmacyGroupDetailsSchema } from '@crystal-pharm/group-db/domain';
import { collectFieldErrors } from '@crystal-pharm/pharmacy-db/domain';
import * as v from 'valibot';
import { readGroupFormValues } from '$lib/groupForm/groupFormSubmission';
import {
	createEmptyGroupFormValues,
	toContractFormValues,
	toCoverageInputs,
	type GroupFormErrors,
	type GroupFormValues
} from '$lib/groupForm/groupFormValues';
import { sendGroupMemberInvitation } from './groupMemberInvitationSending.server';

export type GroupFormPageData = { values: GroupFormValues; catalog: ToolCatalog; flatRateOffers: FlatRateOffer[] };

export type GroupFormFailure = { values: GroupFormValues; fieldErrors: GroupFormErrors };

const OptionalEmailSchema = v.union([v.literal(''), v.pipe(v.string(), v.email())]);

export async function loadGroupCreationForm(): Promise<GroupFormPageData> {
	return { values: createEmptyGroupFormValues(), catalog: await getToolCatalog(), flatRateOffers: await listFlatRateOffers() };
}

export async function loadGroupEditionForm(groupId: string): Promise<(GroupFormPageData & { groupName: string }) | undefined> {
	const group = await getPharmacyGroupForPlatform(groupId);
	if (!group) return undefined;
	const contract = await getGroupContract(platformBillingAccess, groupId);
	const emptyValues = createEmptyGroupFormValues();
	return {
		groupName: group.name,
		catalog: await getToolCatalog(),
		flatRateOffers: await listFlatRateOffers(),
		values: {
			...emptyValues,
			...toContractFormValues(contract),
			name: group.name,
			contactEmail: group.contactEmail ?? '',
			pharmacyQuota: String(group.pharmacyQuota),
			paymentMethod: contract?.paymentMethod ?? emptyValues.paymentMethod,
			billingMode: contract?.billingMode ?? 'usage',
			billingPeriod: contract?.billingPeriod ?? emptyValues.billingPeriod,
			flatRatePrice: formatCentsForInput(contract?.flatRateMonthlyPriceCents),
			flatRateOfferId: contract?.flatRateOfferId ?? ''
		}
	};
}

/** Tout est vérifié avant d'écrire quoi que ce soit : un groupement ne naît jamais sans son contrat. */
export async function createGroupFromSubmission(
	formData: FormData
): Promise<{ isCreated: true; groupId: string; invitedEmail: string | undefined } | ({ isCreated: false } & GroupFormFailure)> {
	const values = readGroupFormValues(formData);
	const fieldErrors = validateGroupForm(values, { isCreation: true });
	if (Object.keys(fieldErrors).length > 0) return { isCreated: false, values, fieldErrors };

	const groupCreation = await createPharmacyGroup(toGroupDetailsInput(values));
	if (!groupCreation.isSaved) return { isCreated: false, values, fieldErrors: groupCreation.fieldErrors };
	await saveGroupContract(groupCreation.groupId, toContractInput(values));

	if (!values.firstGroupMemberEmail) return { isCreated: true, groupId: groupCreation.groupId, invitedEmail: undefined };
	const invitation = await sendGroupMemberInvitation(groupCreation.groupId, values.firstGroupMemberEmail);
	return { isCreated: true, groupId: groupCreation.groupId, invitedEmail: invitation.isSent ? invitation.email : undefined };
}

export async function updateGroupFromSubmission(
	groupId: string,
	formData: FormData
): Promise<{ isSaved: true } | ({ isSaved: false } & GroupFormFailure)> {
	const values = readGroupFormValues(formData);
	const fieldErrors = validateGroupForm(values, { isCreation: false });
	if (Object.keys(fieldErrors).length > 0) return { isSaved: false, values, fieldErrors };

	const groupUpdate = await updatePharmacyGroup(groupId, toGroupDetailsInput(values));
	if (!groupUpdate.isSaved) return { isSaved: false, values, fieldErrors: groupUpdate.fieldErrors };
	await saveGroupContract(groupId, toContractInput(values));
	return { isSaved: true };
}

function validateGroupForm(values: GroupFormValues, { isCreation }: { isCreation: boolean }): GroupFormErrors {
	const fieldErrors: GroupFormErrors = {};
	const detailsValidation = v.safeParse(PharmacyGroupDetailsSchema, toGroupDetailsInput(values));
	if (!detailsValidation.success) Object.assign(fieldErrors, collectFieldErrors(detailsValidation.issues));

	const contractValidation = validateGroupContractInput(toContractInput(values));
	if (!contractValidation.isValid) Object.assign(fieldErrors, contractValidation.fieldErrors);

	if (isCreation && !v.is(OptionalEmailSchema, values.firstGroupMemberEmail)) {
		fieldErrors.firstGroupMemberEmail = 'Cet email n’est pas valide.';
	}
	return fieldErrors;
}

function toGroupDetailsInput(values: GroupFormValues) {
	return { name: values.name, contactEmail: values.contactEmail, pharmacyQuota: values.pharmacyQuota };
}

// Un groupement qui ne paie rien n'a rien à facturer : ni forfait, ni rythme.
function toContractInput(values: GroupFormValues): GroupContractInput {
	const groupPaysNothing = values.whoPays === 'pharmacies';
	return {
		paymentMethod: values.paymentMethod,
		billingMode: groupPaysNothing ? 'usage' : values.billingMode,
		flatRatePriceInput: values.flatRatePrice,
		flatRateOfferId: values.flatRateOfferId,
		billingPeriod: groupPaysNothing || values.billingMode === 'usage' ? 'monthly' : values.billingPeriod,
		coverageInputs: toCoverageInputs(values)
	};
}
