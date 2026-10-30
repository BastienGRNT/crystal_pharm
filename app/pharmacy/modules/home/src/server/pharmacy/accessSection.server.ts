import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import { composeTenantMemberInvitationEmail, sendEmail } from '@crystal-pharm/email';
import {
	appointTenantOwner,
	changeCounterAccountPasswordOfTenant,
	createCounterAccountOfTenant,
	inviteEmployeeToCreateAccount,
	listEmployees,
	listPendingTenantMemberInvitations,
	listTenantMembers,
	removeTenantMember,
	revokeTenantMemberInvitation,
	updateTenantMemberResponsibilities,
	withdrawTenantOwnership,
	type TenantMember,
	type TenantMemberChange
} from '@crystal-pharm/pharmacy-db';
import { formatEmployeeFullName, tenantMemberKindLabels } from '@crystal-pharm/pharmacy-db/domain';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { accessPanelPathname, teamInvitationPathname } from '../../homePathnames';
import { readRequestedAccessPanel } from '../../pages/pharmacy/accessPanel';
import {
	responsibilityFieldName,
	type AccessFailure,
	type AccessFieldName,
	type AccessMember,
	type AccessPanel,
	type AccessSection,
	type PharmacySectionSaved
} from '../../pages/pharmacy/pharmacyPageData';
import { requireOwner } from '../activeTenant.server';
import { readText } from './pharmacyFormSubmissions.server';

type AccessActionResult = PharmacySectionSaved | ActionFailure<AccessFailure>;

export async function loadAccessSection(
	tenantId: string,
	signedInAccountId: string,
	searchParams: URLSearchParams
): Promise<{ access: AccessSection; accessPanel: AccessPanel | undefined }> {
	const [tenantMembers, pendingInvitations, employees] = await Promise.all([
		listTenantMembers(tenantId),
		listPendingTenantMemberInvitations(tenantId),
		listEmployees(tenantId)
	]);
	const members = tenantMembers.map((tenantMember) => toAccessMember(tenantMember, signedInAccountId));
	const unavailableEmployeeIds = new Set([
		...tenantMembers.flatMap((tenantMember) => (tenantMember.employeeId ? [tenantMember.employeeId] : [])),
		...pendingInvitations.map((invitation) => invitation.employeeId)
	]);
	const hasCounterAccount = members.some((member) => member.isCounterAccount);
	return {
		access: {
			members,
			pendingInvitations: pendingInvitations.map(({ invitationId, employeeFullName, email, expiresAt }) => ({
				invitationId,
				employeeFullName,
				email,
				expiresAt
			})),
			invitableEmployees: employees
				.filter((employee) => !unavailableEmployeeIds.has(employee.employeeId))
				.map((employee) => ({ employeeId: employee.employeeId, fullName: formatEmployeeFullName(employee) })),
			hasCounterAccount
		},
		accessPanel: readRequestedAccessPanel(searchParams, members, hasCounterAccount)
	};
}

function toAccessMember(tenantMember: TenantMember, signedInAccountId: string): AccessMember {
	return {
		accountId: tenantMember.accountId,
		name: tenantMember.name,
		detail: tenantMember.username ? `Identifiant : ${tenantMember.username}` : (tenantMember.email ?? ''),
		kindLabel: tenantMemberKindLabels[tenantMember.memberKind],
		isOwner: tenantMember.memberKind === 'owner',
		isCounterAccount: tenantMember.memberKind === 'counter',
		isSignedInAccount: tenantMember.accountId === signedInAccountId,
		responsibilityKeys: tenantMember.responsibilityKeys,
		editHref: accessPanelPathname({ kind: 'member', accountId: tenantMember.accountId })
	};
}

/** Chaque action revérifie que le compte est Owner : l'onglet masqué ne protège rien. */
export const accessSectionActions = {
	inviteEmployee: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const formData = await request.formData();
		const invitationSending = await inviteEmployeeToCreateAccount(tenantId, {
			employeeId: readText(formData, 'employeeId'),
			emailInput: readText(formData, 'email'),
			responsibilityKeyInputs: readResponsibilityKeys(formData)
		});
		if (!invitationSending.isSent) {
			return refuse({ kind: 'invitation' }, invitationSending.failureMessage, 'email');
		}
		await sendEmail(
			composeTenantMemberInvitationEmail({
				to: invitationSending.email,
				employeeFirstName: invitationSending.employeeFirstName,
				pharmacyName: invitationSending.pharmacyName,
				invitationUrl: `${readRequiredEnvironmentVariable('PHARMACY_URL')}${teamInvitationPathname(invitationSending.invitationToken)}`
			})
		);
		return saved(`L’invitation est envoyée à ${invitationSending.email}.`);
	},

	revokeInvitation: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		await revokeTenantMemberInvitation(tenantId, readText(await request.formData(), 'invitationId'));
		return saved('L’invitation est annulée.');
	},

	createCounterAccount: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const formData = await request.formData();
		const creation = await createCounterAccountOfTenant(tenantId, {
			usernameInput: readText(formData, 'username'),
			password: readText(formData, 'password'),
			responsibilityKeyInputs: readResponsibilityKeys(formData)
		});
		if (!creation.isCreated) {
			return refuse({ kind: 'counter-account' }, creation.failureMessage, creation.field === 'form' ? undefined : creation.field);
		}
		return saved(`Le compte comptoir est créé : il se connecte avec l’identifiant « ${creation.username} ».`);
	},

	changeCounterAccountPassword: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const formData = await request.formData();
		const passwordChange = await changeCounterAccountPasswordOfTenant(tenantId, readText(formData, 'password'));
		if (!passwordChange.isChanged) {
			return refuse({ kind: 'member', accountId: readText(formData, 'accountId') }, passwordChange.failureMessage, 'password');
		}
		return saved('Le mot de passe du compte comptoir est changé : il faut s’y reconnecter.');
	},

	updateResponsibilities: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const formData = await request.formData();
		const accountId = readText(formData, 'accountId');
		return describeChange(
			await updateTenantMemberResponsibilities(tenantId, accountId, readResponsibilityKeys(formData)),
			{ kind: 'member', accountId },
			'Les responsabilités sont enregistrées.'
		);
	},

	appointOwner: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const accountId = readText(await request.formData(), 'accountId');
		return describeChange(await appointTenantOwner(tenantId, accountId), { kind: 'member', accountId }, 'Ce compte est maintenant titulaire.');
	},

	withdrawOwnership: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const accountId = readText(await request.formData(), 'accountId');
		return describeChange(
			await withdrawTenantOwnership(tenantId, accountId),
			{ kind: 'member', accountId },
			'Ce compte n’est plus titulaire. Choisissez ses responsabilités.'
		);
	},

	removeMember: async ({ locals, request }: RequestEvent): Promise<AccessActionResult> => {
		const { tenantId } = await requireOwner(locals.user);
		const accountId = readText(await request.formData(), 'accountId');
		return describeChange(await removeTenantMember(tenantId, accountId), { kind: 'member', accountId }, 'Ce compte n’a plus accès à la pharmacie.');
	}
};

function describeChange(change: TenantMemberChange, accessPanel: AccessPanel, savedMessage: string): AccessActionResult {
	return change.isChanged ? saved(savedMessage) : refuse(accessPanel, change.failureMessage, undefined);
}

function saved(savedMessage: string): PharmacySectionSaved {
	return { savedSection: 'access', savedMessage };
}

function refuse(
	accessPanel: AccessPanel,
	failureMessage: string,
	failedFieldName: AccessFieldName | undefined
): ActionFailure<AccessFailure> {
	return fail(400, { failedSection: 'access', accessPanel, failureMessage, failedFieldName });
}

function readResponsibilityKeys(formData: FormData): string[] {
	return formData.getAll(responsibilityFieldName).filter((value): value is string => typeof value === 'string');
}
