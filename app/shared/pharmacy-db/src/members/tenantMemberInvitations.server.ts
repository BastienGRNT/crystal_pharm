import { computeInvitationExpiry, generateInvitationToken, hashInvitationToken } from '@crystal-pharm/auth/toolkit';
import { users } from '@crystal-pharm/auth/customer-tables';
import { and, desc, eq, gt, isNull } from 'drizzle-orm';
import * as v from 'valibot';
import { runAsInvitationHolder, runAsTenant } from '../database/pharmacyDatabase.server';
import { employees, tenantMemberInvitations, tenantMemberships, tenants } from '../database/pharmacyTables';
import { formatEmployeeFullName } from '../employees/employeeIdentity';
import { FirstName } from '../employees/identity/FirstName';
import { LastName } from '../employees/identity/LastName';
import { keepKnownResponsibilityKeys, type ResponsibilityKey } from './responsibilities';

export type TenantMemberInvitationStatus = 'pending' | 'expired' | 'accepted' | 'revoked';

export type PendingTenantMemberInvitation = {
	invitationId: string;
	employeeId: string;
	employeeFullName: string;
	email: string;
	responsibilityKeys: readonly ResponsibilityKey[];
	expiresAt: Date;
};

export type TenantMemberInvitationSending =
	| { isSent: true; email: string; invitationToken: string; pharmacyName: string; employeeFirstName: string }
	| { isSent: false; failureMessage: string };

/** Ce que voit la personne invitée, avant d'avoir un compte. */
export type TenantMemberInvitationPreview = {
	pharmacyName: string;
	email: string;
	employeeFirstName: string;
	employeeLastName: string;
	status: TenantMemberInvitationStatus;
};

export type TenantMemberInvitationAcceptance =
	| { isAccepted: true; tenantId: string }
	| { isAccepted: false; failureMessage: string };

export const tenantMemberInvitationUnavailableMessages: Record<Exclude<TenantMemberInvitationStatus, 'pending'>, string> = {
	expired: 'Cette invitation a expiré. Demandez à votre titulaire de vous en renvoyer une.',
	accepted: 'Cette invitation a déjà été utilisée. Connectez-vous pour accéder à votre pharmacie.',
	revoked: 'Cette invitation a été annulée.'
};

const EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email());

function describeInvitationStatus(
	invitation: { expiresAt: Date; acceptedAt: Date | null; revokedAt: Date | null },
	now: Date
): TenantMemberInvitationStatus {
	if (invitation.acceptedAt) return 'accepted';
	if (invitation.revokedAt) return 'revoked';
	if (invitation.expiresAt <= now) return 'expired';
	return 'pending';
}

function isPendingInvitation() {
	return and(
		isNull(tenantMemberInvitations.acceptedAt),
		isNull(tenantMemberInvitations.revokedAt),
		gt(tenantMemberInvitations.expiresAt, new Date())
	);
}

export async function listPendingTenantMemberInvitations(tenantId: string): Promise<PendingTenantMemberInvitation[]> {
	const invitationRows = await runAsTenant(tenantId, (transaction) =>
		transaction
			.select({ invitation: tenantMemberInvitations, employee: employees })
			.from(tenantMemberInvitations)
			.innerJoin(employees, eq(employees.id, tenantMemberInvitations.employeeId))
			.where(and(eq(tenantMemberInvitations.tenantId, tenantId), isPendingInvitation()))
			.orderBy(desc(tenantMemberInvitations.createdAt))
	);
	return invitationRows.map(({ invitation, employee }) => ({
		invitationId: invitation.id,
		employeeId: employee.id,
		employeeFullName: formatEmployeeFullName({
			firstName: FirstName.fromStorageFormat(employee.firstName),
			lastName: LastName.fromStorageFormat(employee.lastName)
		}),
		email: invitation.email,
		responsibilityKeys: keepKnownResponsibilityKeys(invitation.responsibilityKeys),
		expiresAt: invitation.expiresAt
	}));
}

/**
 * Invite un Employee de l'équipe à créer son compte, avec les Responsibilities choisies.
 * Renvoie le jeton à mettre dans le lien de l'email ; une invitation en attente pour cet
 * Employee est remplacée.
 */
export async function inviteEmployeeToCreateAccount(
	tenantId: string,
	{
		employeeId,
		emailInput,
		responsibilityKeyInputs
	}: { employeeId: string; emailInput: string; responsibilityKeyInputs: readonly string[] }
): Promise<TenantMemberInvitationSending> {
	const emailValidation = v.safeParse(EmailSchema, emailInput);
	if (!emailValidation.success) return { isSent: false, failureMessage: 'Cet email n’est pas valide.' };
	const email = emailValidation.output;

	return runAsTenant(tenantId, async (transaction) => {
		const [employee] = await transaction
			.select({ firstName: employees.firstName })
			.from(employees)
			.where(and(eq(employees.id, employeeId), eq(employees.tenantId, tenantId)));
		if (!employee) return { isSent: false, failureMessage: 'Ce membre de l’équipe n’existe plus.' };

		const [linkedMembership] = await transaction
			.select({ accountId: tenantMemberships.accountId })
			.from(tenantMemberships)
			.where(and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.employeeId, employeeId)));
		if (linkedMembership) return { isSent: false, failureMessage: 'Ce membre de l’équipe a déjà un compte.' };

		const [memberWithSameEmail] = await transaction
			.select({ accountId: tenantMemberships.accountId })
			.from(tenantMemberships)
			.innerJoin(users, eq(users.id, tenantMemberships.accountId))
			.where(and(eq(tenantMemberships.tenantId, tenantId), eq(users.email, email)));
		if (memberWithSameEmail) return { isSent: false, failureMessage: 'Un compte de la pharmacie utilise déjà cet email.' };

		const [tenant] = await transaction.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, tenantId));
		if (!tenant) return { isSent: false, failureMessage: 'Cette pharmacie n’existe plus.' };

		const now = new Date();
		await transaction
			.update(tenantMemberInvitations)
			.set({ revokedAt: now })
			.where(
				and(
					eq(tenantMemberInvitations.tenantId, tenantId),
					eq(tenantMemberInvitations.employeeId, employeeId),
					isNull(tenantMemberInvitations.acceptedAt),
					isNull(tenantMemberInvitations.revokedAt)
				)
			);

		const invitationToken = generateInvitationToken();
		await transaction.insert(tenantMemberInvitations).values({
			id: crypto.randomUUID(),
			tenantId,
			employeeId,
			email,
			responsibilityKeys: keepKnownResponsibilityKeys(responsibilityKeyInputs),
			tokenHash: hashInvitationToken(invitationToken),
			expiresAt: computeInvitationExpiry(now)
		});
		return {
			isSent: true,
			email,
			invitationToken,
			pharmacyName: tenant.name,
			employeeFirstName: FirstName.fromStorageFormat(employee.firstName).toDisplayFormat()
		};
	});
}

export async function revokeTenantMemberInvitation(tenantId: string, invitationId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) =>
		transaction
			.update(tenantMemberInvitations)
			.set({ revokedAt: new Date() })
			.where(and(eq(tenantMemberInvitations.id, invitationId), eq(tenantMemberInvitations.tenantId, tenantId)))
	);
}

export async function findTenantMemberInvitation(invitationToken: string): Promise<TenantMemberInvitationPreview | undefined> {
	const invitation = await findInvitationByToken(invitationToken);
	if (!invitation) return undefined;

	// La Row-Level Security ne montre que l'invitation au détenteur du jeton : la
	// pharmacie et l'Employee se lisent dans le Tenant qu'elle désigne.
	const [invitedEmployee] = await runAsTenant(invitation.tenantId, (transaction) =>
		transaction
			.select({ pharmacyName: tenants.name, firstName: employees.firstName, lastName: employees.lastName })
			.from(employees)
			.innerJoin(tenants, eq(tenants.id, employees.tenantId))
			.where(eq(employees.id, invitation.employeeId))
	);
	if (!invitedEmployee) return undefined;
	return {
		pharmacyName: invitedEmployee.pharmacyName,
		email: invitation.email,
		employeeFirstName: FirstName.fromStorageFormat(invitedEmployee.firstName).toDisplayFormat(),
		employeeLastName: LastName.fromStorageFormat(invitedEmployee.lastName).toDisplayFormat(),
		status: describeInvitationStatus(invitation, new Date())
	};
}

/** L'invitation est nominative : seul le compte de l'email invité peut l'accepter. */
export async function acceptTenantMemberInvitation(
	invitationToken: string,
	account: { accountId: string; email: string }
): Promise<TenantMemberInvitationAcceptance> {
	const invitationFoundByToken = await findInvitationByToken(invitationToken);
	if (!invitationFoundByToken) return { isAccepted: false, failureMessage: 'Cette invitation n’existe pas.' };
	const { tenantId } = invitationFoundByToken;

	return runAsTenant(tenantId, async (transaction) => {
		// Relue verrouillée : deux clics simultanés n'acceptent qu'une fois.
		const [invitation] = await transaction
			.select()
			.from(tenantMemberInvitations)
			.where(eq(tenantMemberInvitations.id, invitationFoundByToken.id))
			.for('update');
		if (!invitation) return { isAccepted: false, failureMessage: 'Cette invitation n’existe pas.' };

		const status = describeInvitationStatus(invitation, new Date());
		if (status !== 'pending') return { isAccepted: false, failureMessage: tenantMemberInvitationUnavailableMessages[status] };
		if (invitation.email !== account.email.toLowerCase()) {
			return {
				isAccepted: false,
				failureMessage: `Cette invitation est adressée à ${invitation.email}. Connectez-vous avec ce compte.`
			};
		}

		const [existingMembership] = await transaction
			.select({ accountId: tenantMemberships.accountId })
			.from(tenantMemberships)
			.where(and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.accountId, account.accountId)));
		if (existingMembership) return { isAccepted: false, failureMessage: 'Votre compte fait déjà partie de cette pharmacie.' };

		await transaction.insert(tenantMemberships).values({
			tenantId,
			accountId: account.accountId,
			memberKind: 'employee',
			responsibilityKeys: keepKnownResponsibilityKeys(invitation.responsibilityKeys),
			employeeId: invitation.employeeId
		});
		await transaction
			.update(tenantMemberInvitations)
			.set({ acceptedAt: new Date() })
			.where(eq(tenantMemberInvitations.id, invitation.id));
		return { isAccepted: true, tenantId };
	});
}

async function findInvitationByToken(invitationToken: string) {
	const invitationTokenHash = hashInvitationToken(invitationToken);
	const [invitation] = await runAsInvitationHolder(invitationTokenHash, (transaction) =>
		transaction.select().from(tenantMemberInvitations).where(eq(tenantMemberInvitations.tokenHash, invitationTokenHash))
	);
	return invitation;
}
