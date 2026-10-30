import { users } from '@crystal-pharm/auth/customer-tables';
import { and, asc, desc, eq, gt, isNull } from 'drizzle-orm';
import * as v from 'valibot';
import { runWithGroupAccess, type GroupAccess } from '../database/groupDatabase.server';
import { groupMemberInvitations, groupMembers, pharmacyGroups } from '../database/groupTables';
import { describeInvitationStatus, type InvitationStatus } from '../invitations/invitationStatus';
import { computeInvitationExpiry, generateInvitationToken, hashInvitationToken } from '@crystal-pharm/auth/toolkit';

export type GroupMember = { accountId: string; name: string; email: string; joinedAt: Date };

export type PendingGroupMemberInvitation = { invitationId: string; email: string; expiresAt: Date; createdAt: Date };

/** Qui invite un GroupMember : la Platform (le premier), ou un GroupMember du même groupement. */
export type GroupMemberInviter = { kind: 'platform' } | { kind: 'group-member'; groupId: string };

export type GroupMemberInvitationSending =
	| { isSent: true; email: string; invitationToken: string; groupName: string }
	| { isSent: false; failureMessage: string };

export type GroupMemberInvitationPreview = { groupName: string; email: string; status: InvitationStatus };

export type GroupMemberInvitationAcceptance =
	| { isAccepted: true; groupId: string }
	| { isAccepted: false; failureMessage: string };

const EmailSchema = v.pipe(v.string(), v.trim(), v.toLowerCase(), v.email());

function toGroupAccess(inviter: GroupMemberInviter): GroupAccess {
	return inviter.kind === 'platform' ? { isPlatform: true } : { groupId: inviter.groupId };
}

/** Le groupement sur lequel travaille le compte ; `undefined` s'il n'est membre d'aucun. */
export async function findActiveGroupIdOfAccount(accountId: string): Promise<string | undefined> {
	const [firstMembership] = await runWithGroupAccess({ accountId }, (transaction) =>
		transaction
			.select({ groupId: groupMembers.groupId })
			.from(groupMembers)
			.where(eq(groupMembers.accountId, accountId))
			.orderBy(asc(groupMembers.createdAt))
			.limit(1)
	);
	return firstMembership?.groupId;
}

export function listGroupMembers(inviter: GroupMemberInviter, groupId: string): Promise<GroupMember[]> {
	return runWithGroupAccess(toGroupAccess(inviter), (transaction) =>
		transaction
			.select({ accountId: users.id, name: users.name, email: users.email, joinedAt: groupMembers.createdAt })
			.from(groupMembers)
			.innerJoin(users, eq(users.id, groupMembers.accountId))
			.where(eq(groupMembers.groupId, groupId))
			.orderBy(asc(groupMembers.createdAt))
	);
}

export function listPendingGroupMemberInvitations(
	inviter: GroupMemberInviter,
	groupId: string
): Promise<PendingGroupMemberInvitation[]> {
	return runWithGroupAccess(toGroupAccess(inviter), (transaction) =>
		transaction
			.select({
				invitationId: groupMemberInvitations.id,
				email: groupMemberInvitations.email,
				expiresAt: groupMemberInvitations.expiresAt,
				createdAt: groupMemberInvitations.createdAt
			})
			.from(groupMemberInvitations)
			.where(
				and(
					eq(groupMemberInvitations.groupId, groupId),
					isNull(groupMemberInvitations.acceptedAt),
					isNull(groupMemberInvitations.revokedAt),
					gt(groupMemberInvitations.expiresAt, new Date())
				)
			)
			.orderBy(desc(groupMemberInvitations.createdAt))
	);
}

/** Renvoie le jeton à mettre dans le lien de l'email ; une invitation déjà en attente est remplacée. */
export async function inviteGroupMember(
	inviter: GroupMemberInviter,
	groupId: string,
	emailInput: string
): Promise<GroupMemberInvitationSending> {
	const emailValidation = v.safeParse(EmailSchema, emailInput);
	if (!emailValidation.success) return { isSent: false, failureMessage: 'Cet email n’est pas valide.' };
	const email = emailValidation.output;

	return runWithGroupAccess(toGroupAccess(inviter), async (transaction) => {
		const [group] = await transaction.select({ name: pharmacyGroups.name }).from(pharmacyGroups).where(eq(pharmacyGroups.id, groupId));
		if (!group) return { isSent: false, failureMessage: 'Ce groupement n’existe pas.' };

		const [existingMember] = await transaction
			.select({ accountId: groupMembers.accountId })
			.from(groupMembers)
			.innerJoin(users, eq(users.id, groupMembers.accountId))
			.where(and(eq(groupMembers.groupId, groupId), eq(users.email, email)));
		if (existingMember) return { isSent: false, failureMessage: 'Cette personne fait déjà partie du groupement.' };

		const now = new Date();
		await transaction
			.update(groupMemberInvitations)
			.set({ revokedAt: now })
			.where(
				and(
					eq(groupMemberInvitations.groupId, groupId),
					eq(groupMemberInvitations.email, email),
					isNull(groupMemberInvitations.acceptedAt),
					isNull(groupMemberInvitations.revokedAt)
				)
			);

		const invitationToken = generateInvitationToken();
		await transaction.insert(groupMemberInvitations).values({
			id: crypto.randomUUID(),
			groupId,
			email,
			tokenHash: hashInvitationToken(invitationToken),
			expiresAt: computeInvitationExpiry(now)
		});
		return { isSent: true, email, invitationToken, groupName: group.name };
	});
}

export async function revokeGroupMemberInvitation(
	inviter: GroupMemberInviter,
	groupId: string,
	invitationId: string
): Promise<void> {
	await runWithGroupAccess(toGroupAccess(inviter), (transaction) =>
		transaction
			.update(groupMemberInvitations)
			.set({ revokedAt: new Date() })
			.where(and(eq(groupMemberInvitations.id, invitationId), eq(groupMemberInvitations.groupId, groupId)))
	);
}

export async function findGroupMemberInvitation(
	invitationToken: string
): Promise<GroupMemberInvitationPreview | undefined> {
	const invitationTokenHash = hashInvitationToken(invitationToken);
	const [invitation] = await runWithGroupAccess({ invitationTokenHash }, (transaction) =>
		transaction
			.select({ invitation: groupMemberInvitations, groupName: pharmacyGroups.name })
			.from(groupMemberInvitations)
			.innerJoin(pharmacyGroups, eq(pharmacyGroups.id, groupMemberInvitations.groupId))
			.where(eq(groupMemberInvitations.tokenHash, invitationTokenHash))
	);
	if (!invitation) return undefined;
	return {
		groupName: invitation.groupName,
		email: invitation.invitation.email,
		status: describeInvitationStatus(invitation.invitation, new Date())
	};
}

/** L'invitation est nominative : seul le compte de l'email invité peut l'accepter. */
export async function acceptGroupMemberInvitation(
	invitationToken: string,
	account: { accountId: string; email: string }
): Promise<GroupMemberInvitationAcceptance> {
	const invitationTokenHash = hashInvitationToken(invitationToken);
	return runWithGroupAccess({ invitationTokenHash, accountId: account.accountId }, async (transaction) => {
		const [invitation] = await transaction
			.select()
			.from(groupMemberInvitations)
			.where(eq(groupMemberInvitations.tokenHash, invitationTokenHash));
		if (!invitation) return { isAccepted: false, failureMessage: 'Cette invitation n’existe pas.' };

		const status = describeInvitationStatus(invitation, new Date());
		if (status !== 'pending') return { isAccepted: false, failureMessage: invitationUnavailableMessages[status] };
		if (invitation.email !== account.email.toLowerCase()) {
			return {
				isAccepted: false,
				failureMessage: `Cette invitation est adressée à ${invitation.email}. Connectez-vous avec ce compte.`
			};
		}

		await transaction
			.insert(groupMembers)
			.values({ groupId: invitation.groupId, accountId: account.accountId })
			.onConflictDoNothing();
		await transaction
			.update(groupMemberInvitations)
			.set({ acceptedAt: new Date() })
			.where(eq(groupMemberInvitations.id, invitation.id));
		return { isAccepted: true, groupId: invitation.groupId };
	});
}

export const invitationUnavailableMessages: Record<Exclude<InvitationStatus, 'pending'>, string> = {
	expired: 'Cette invitation a expiré. Demandez-en une nouvelle.',
	accepted: 'Cette invitation a déjà été utilisée.',
	declined: 'Cette invitation a été refusée.',
	revoked: 'Cette invitation a été annulée.'
};
