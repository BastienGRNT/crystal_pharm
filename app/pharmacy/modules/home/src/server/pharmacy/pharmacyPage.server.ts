import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getToolAccessOfTenant } from '@crystal-pharm/billing-db';
import { findTool, summarizeCoverage } from '@crystal-pharm/billing-db/domain';
import { findCurrentGroupOfTenant, leaveGroup } from '@crystal-pharm/group-db';
import {
	addEmployee,
	getPharmacyProfile,
	listEmployees,
	removeEmployee,
	updateEmployee,
	updatePharmacyContactDetails,
	updateWeeklyOpeningSchedule,
	type Employee
} from '@crystal-pharm/pharmacy-db';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { employeePanelPathname, employeePhotoPathname } from '../../homePathnames';
import { readRequestedEmployeePanel } from '../../pages/pharmacy/employeePanel';
import type {
	ContactDetailsFailure,
	EmployeeFailure,
	OpeningHoursFailure,
	PharmacyGroupSection,
	PharmacyPageData,
	PharmacySectionSaved,
	TeamMember
} from '../../pages/pharmacy/pharmacyPageData';
import { readSelectedPharmacySection } from '../../pages/pharmacy/pharmacySectionTabs';
import { requireActiveTenantId } from '../activeTenant.server';
import { openingHoursRefusedMessage } from '../onboarding/openingHoursStep.server';
import {
	readContactDetailsInput,
	readEmployeeId,
	readEmployeeIdentityInput,
	readEmployeePhotoChange,
	readWeeklyOpeningScheduleInput
} from './pharmacyFormSubmissions.server';

export async function loadPharmacyPage({
	locals,
	url
}: {
	locals: { user: AuthenticatedUser | null };
	url: URL;
}): Promise<PharmacyPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const [pharmacyProfile, group, employees] = await Promise.all([
		getPharmacyProfile(tenantId),
		loadPharmacyGroupSection(tenantId),
		listEmployees(tenantId)
	]);
	const team = employees.map(toTeamMember);
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
		weeklyOpeningSchedule: pharmacyProfile.weeklyOpeningSchedule,
		team,
		employeePanel: readRequestedEmployeePanel(url.searchParams, team)
	};
}

function toTeamMember(employee: Employee): TeamMember {
	return {
		employeeId: employee.employeeId,
		identity: {
			firstName: employee.firstName.toDisplayFormat(),
			lastName: employee.lastName.toDisplayFormat(),
			jobTitle: employee.jobTitle.toDisplayFormat()
		},
		fullName: formatEmployeeFullName(employee),
		photoUrl: employee.photoId && employeePhotoPathname(employee.photoId),
		editHref: employeePanelPathname(employee.employeeId)
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

	addEmployee: async ({ locals, request }: RequestEvent): Promise<PharmacySectionSaved | ActionFailure<EmployeeFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const submittedIdentity = readEmployeeIdentityInput(formData);
		const employeeAddition = await addEmployee(tenantId, submittedIdentity, readEmployeePhotoChange(formData));
		if (!employeeAddition.isSaved) {
			return fail(400, { failedSection: 'team', employeeId: undefined, submittedIdentity, fieldErrors: employeeAddition.fieldErrors });
		}
		return { savedSection: 'team' };
	},

	updateEmployee: async ({ locals, request }: RequestEvent): Promise<PharmacySectionSaved | ActionFailure<EmployeeFailure>> => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const employeeId = readEmployeeId(formData);
		const submittedIdentity = readEmployeeIdentityInput(formData);
		const employeeUpdate = await updateEmployee(tenantId, employeeId, submittedIdentity, readEmployeePhotoChange(formData));
		if (!employeeUpdate.isSaved) {
			return fail(400, { failedSection: 'team', employeeId, submittedIdentity, fieldErrors: employeeUpdate.fieldErrors });
		}
		return { savedSection: 'team' };
	},

	removeEmployee: async ({ locals, request }: RequestEvent): Promise<PharmacySectionSaved> => {
		const tenantId = await requireActiveTenantId(locals.user);
		await removeEmployee(tenantId, readEmployeeId(await request.formData()));
		return { savedSection: 'team' };
	},

	leaveGroup: async ({ locals }: RequestEvent): Promise<PharmacySectionSaved> => {
		await leaveGroup(await requireActiveTenantId(locals.user));
		return { savedSection: 'group' };
	}
};
