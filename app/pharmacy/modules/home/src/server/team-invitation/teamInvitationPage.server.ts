import { findCustomerAccountIdByEmail } from '@crystal-pharm/auth';
import {
	acceptTenantMemberInvitation,
	findTenantMemberInvitation,
	tenantMemberInvitationUnavailableMessages
} from '@crystal-pharm/pharmacy-db';
import { error, fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { homePathnames, teamInvitationPathname } from '../../homePathnames';
import type { TeamInvitationFailure, TeamInvitationPageData } from '../../pages/team-invitation/teamInvitationPageData';

export async function loadTeamInvitationPage({
	locals,
	params
}: {
	locals: App.Locals;
	params: { invitationToken: string };
}): Promise<TeamInvitationPageData> {
	const invitation = await findTenantMemberInvitation(params.invitationToken);
	if (!invitation) error(404, 'Cette invitation n’existe pas. Vérifiez le lien reçu par email.');
	return {
		invitationToken: params.invitationToken,
		pharmacyName: invitation.pharmacyName,
		invitedEmail: invitation.email,
		employeeFirstName: invitation.employeeFirstName,
		employeeLastName: invitation.employeeLastName,
		visitorSituation: await describeVisitorSituation(locals.user?.email, invitation.email),
		signedInEmail: locals.user?.email,
		unavailableMessage: invitation.status === 'pending' ? undefined : tenantMemberInvitationUnavailableMessages[invitation.status]
	};
}

export const teamInvitationPageActions = {
	default: async ({
		locals,
		params
	}: RequestEvent<{ invitationToken: string }>): Promise<ActionFailure<TeamInvitationFailure>> => {
		const invitationPathname = teamInvitationPathname(params.invitationToken);
		if (!locals.user) redirect(303, `${homePathnames.login}?${new URLSearchParams({ redirectTo: invitationPathname })}`);
		const acceptance = await acceptTenantMemberInvitation(params.invitationToken, {
			accountId: locals.user.userId,
			email: locals.user.email
		});
		if (!acceptance.isAccepted) return fail(400, { failureMessage: acceptance.failureMessage });
		redirect(303, homePathnames.toolsHome);
	}
};

async function describeVisitorSituation(
	signedInEmail: string | undefined,
	invitedEmail: string
): Promise<TeamInvitationPageData['visitorSituation']> {
	if (signedInEmail) return signedInEmail.toLowerCase() === invitedEmail ? 'signed-in-as-invited' : 'signed-in-as-someone-else';
	return (await findCustomerAccountIdByEmail(invitedEmail)) ? 'has-account' : 'needs-account';
}
