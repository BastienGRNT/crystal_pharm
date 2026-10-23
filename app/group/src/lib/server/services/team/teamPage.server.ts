import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import { composeGroupMemberInvitationEmail, sendEmail } from '@crystal-pharm/email';
import {
	inviteGroupMember,
	listGroupMembers,
	listPendingGroupMemberInvitations,
	revokeGroupMemberInvitation,
	type GroupMember,
	type PendingGroupMemberInvitation
} from '@crystal-pharm/group-db';
import { fail, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { requireActiveGroupId, requireSignedInUser } from '$lib/server/activeGroup.server';

export type TeamPageData = {
	groupMembers: GroupMember[];
	pendingInvitations: PendingGroupMemberInvitation[];
	signedInAccountId: string;
};

export type TeamActionResult = { succeededAction: 'inviteColleague'; invitedEmail: string } | { succeededAction: 'revokeInvitation' };

export type TeamActionFailure = { failedAction: 'inviteColleague'; failureMessage: string; submittedEmail: string };

export async function loadTeamPage({ locals }: { locals: App.Locals }): Promise<TeamPageData> {
	const groupId = await requireActiveGroupId(locals.user);
	const inviter = { kind: 'group-member', groupId } as const;
	return {
		groupMembers: await listGroupMembers(inviter, groupId),
		pendingInvitations: await listPendingGroupMemberInvitations(inviter, groupId),
		signedInAccountId: requireSignedInUser(locals.user).userId
	};
}

export const teamPageActions = {
	inviteColleague: async ({ locals, request }: RequestEvent): Promise<TeamActionResult | ActionFailure<TeamActionFailure>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const submittedEmail = String((await request.formData()).get('email') ?? '').trim();
		const invitation = await inviteGroupMember({ kind: 'group-member', groupId }, groupId, submittedEmail);
		if (!invitation.isSent) {
			return fail(400, { failedAction: 'inviteColleague', failureMessage: invitation.failureMessage, submittedEmail });
		}
		await sendEmail(
			composeGroupMemberInvitationEmail({
				to: invitation.email,
				groupName: invitation.groupName,
				invitationUrl: `${readRequiredEnvironmentVariable('GROUP_URL')}/invitation/${invitation.invitationToken}`
			})
		);
		return { succeededAction: 'inviteColleague', invitedEmail: invitation.email };
	},

	revokeInvitation: async ({ locals, request }: RequestEvent): Promise<TeamActionResult> => {
		const groupId = await requireActiveGroupId(locals.user);
		const invitationId = String((await request.formData()).get('invitationId') ?? '');
		await revokeGroupMemberInvitation({ kind: 'group-member', groupId }, groupId, invitationId);
		return { succeededAction: 'revokeInvitation' };
	}
};
