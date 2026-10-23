import { findCustomerAccountIdByEmail } from '@crystal-pharm/auth';
import { acceptGroupMemberInvitation, findGroupMemberInvitation, type GroupMemberInvitationPreview } from '@crystal-pharm/group-db';
import { error, fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';

/** Ce que voit la personne invitée : rejoindre, se connecter ou créer son compte. */
export type GroupMemberInvitationPageData = {
	invitation: GroupMemberInvitationPreview;
	/** `signed-in-as-invited` : un clic pour rejoindre · `signed-in-as-someone-else` : se déconnecter d'abord. */
	visitorSituation: 'signed-in-as-invited' | 'signed-in-as-someone-else' | 'has-account' | 'needs-account';
	signedInEmail: string | undefined;
};

export async function loadGroupMemberInvitationPage({
	locals,
	params
}: {
	locals: App.Locals;
	params: { invitationToken: string };
}): Promise<GroupMemberInvitationPageData> {
	const invitation = await findGroupMemberInvitation(params.invitationToken);
	if (!invitation) error(404, 'Cette invitation n’existe pas. Vérifiez le lien reçu par email.');
	return {
		invitation,
		visitorSituation: await describeVisitorSituation(locals.user?.email, invitation.email),
		signedInEmail: locals.user?.email
	};
}

export const groupMemberInvitationPageActions = {
	default: async ({
		locals,
		params
	}: RequestEvent<{ invitationToken: string }>): Promise<ActionFailure<{ failureMessage: string }>> => {
		if (!locals.user) redirect(303, `/login?redirectTo=/invitation/${params.invitationToken}`);
		const acceptance = await acceptGroupMemberInvitation(params.invitationToken, {
			accountId: locals.user.userId,
			email: locals.user.email
		});
		if (!acceptance.isAccepted) return fail(400, { failureMessage: acceptance.failureMessage });
		redirect(303, '/?bienvenue=1');
	}
};

async function describeVisitorSituation(
	signedInEmail: string | undefined,
	invitedEmail: string
): Promise<GroupMemberInvitationPageData['visitorSituation']> {
	if (signedInEmail) return signedInEmail.toLowerCase() === invitedEmail ? 'signed-in-as-invited' : 'signed-in-as-someone-else';
	return (await findCustomerAccountIdByEmail(invitedEmail)) ? 'has-account' : 'needs-account';
}
