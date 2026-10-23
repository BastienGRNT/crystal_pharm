import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getToolAccessOfTenant } from '@crystal-pharm/billing-db';
import { findTool, summarizeCoverage } from '@crystal-pharm/billing-db/domain';
import { findCurrentGroupOfTenant, leaveGroup } from '@crystal-pharm/group-db';
import {
	getPharmacyProfile,
	updatePharmacyContactDetails,
	updateWeeklyOpeningSchedule
} from '@crystal-pharm/pharmacy-db';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import type {
	ContactDetailsFailure,
	OpeningHoursFailure,
	PharmacyGroupSection,
	PharmacyPageData,
	PharmacySectionSaved
} from '../../pages/pharmacy/pharmacyPageData';
import { readSelectedPharmacySection } from '../../pages/pharmacy/pharmacySectionTabs';
import { requireActiveTenantId } from '../activeTenant.server';
import { openingHoursRefusedMessage } from '../onboarding/openingHoursStep.server';
import { readContactDetailsInput, readWeeklyOpeningScheduleInput } from './pharmacyFormSubmissions.server';

export async function loadPharmacyPage({
	locals,
	url
}: {
	locals: { user: AuthenticatedUser | null };
	url: URL;
}): Promise<PharmacyPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const [pharmacyProfile, group] = await Promise.all([getPharmacyProfile(tenantId), loadPharmacyGroupSection(tenantId)]);
	return {
		selectedSection: readSelectedPharmacySection(url.searchParams, group !== undefined),
		group,
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

async function loadPharmacyGroupSection(tenantId: string): Promise<PharmacyGroupSection | undefined> {
	const [toolAccess, currentGroup] = await Promise.all([getToolAccessOfTenant(tenantId), findCurrentGroupOfTenant(tenantId)]);
	const coveringGroup = toolAccess.coveringGroup;
	if (!coveringGroup) return undefined;
	return {
		groupName: coveringGroup.groupName,
		joinedAt: currentGroup?.joinedAt,
		coverageEndsAt: coveringGroup.coverageEndsAt,
		coverageLines: coveringGroup.coverages.map(
			(coverage) => `${findTool(coverage.toolKey).label} : ${summarizeCoverage(coverage)?.toLowerCase() ?? 'prix normal'}`
		)
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
	},

	leaveGroup: async ({ locals }: RequestEvent): Promise<PharmacySectionSaved> => {
		await leaveGroup(await requireActiveTenantId(locals.user));
		return { savedSection: 'group' };
	}
};
