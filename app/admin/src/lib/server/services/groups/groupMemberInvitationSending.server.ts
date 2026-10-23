import { readRequiredEnvironmentVariable } from '@crystal-pharm/auth/toolkit';
import { composeGroupMemberInvitationEmail, sendEmail } from '@crystal-pharm/email';
import { inviteGroupMember } from '@crystal-pharm/group-db';

export type GroupMemberInvitationOutcome = { isSent: true; email: string } | { isSent: false; failureMessage: string };

/** La Platform invite un responsable du groupement : un email avec le lien vers l'espace groupement. */
export async function sendGroupMemberInvitation(groupId: string, email: string): Promise<GroupMemberInvitationOutcome> {
	const invitation = await inviteGroupMember({ kind: 'platform' }, groupId, email);
	if (!invitation.isSent) return invitation;
	await sendEmail(
		composeGroupMemberInvitationEmail({
			to: invitation.email,
			groupName: invitation.groupName,
			invitationUrl: `${readRequiredEnvironmentVariable('GROUP_URL')}/invitation/${invitation.invitationToken}`
		})
	);
	return { isSent: true, email: invitation.email };
}
