import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getToolAccessOfTenant, previewGroupJoining } from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { findCurrentGroupOfTenant, listPendingInvitationsForAccountEmail } from '@crystal-pharm/group-db';
import { describeToolCards } from '../../domain/toolCards';
import type { ToolsHomePageData } from '../../pages/tools-home/toolsHomePageData';
import { requireActiveTenantId } from '../activeTenant.server';

export async function loadToolsHomePage({ locals }: { locals: { user: AuthenticatedUser | null } }): Promise<ToolsHomePageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const accountEmail = locals.user?.email ?? '';
	const [toolAccess, currentGroup, pendingInvitations] = await Promise.all([
		getToolAccessOfTenant(tenantId),
		findCurrentGroupOfTenant(tenantId),
		listPendingInvitationsForAccountEmail(accountEmail)
	]);
	return {
		toolCards: describeToolCards(toolAccess),
		coveringGroup: toolAccess.coveringGroup && {
			groupName: toolAccess.coveringGroup.groupName,
			coverageEndsAt: toolAccess.coveringGroup.coverageEndsAt,
			isContractActive: toolAccess.coveringGroup.contractStatus === 'active',
			joinedAt: currentGroup?.joinedAt
		},
		hasSubscription: toolAccess.subscription !== undefined,
		pendingInvitations: await Promise.all(
			pendingInvitations.map(async (invitation) => {
				const preview = await previewGroupJoining(tenantId, invitation.groupId, {
					invitationId: invitation.invitationId,
					accountEmail
				});
				const toolKeysByCoverage = (isWanted: (coverageKind: string, isIncluded: boolean) => boolean): ToolKey[] =>
					preview.joinedQuote.toolQuotes
						.filter((toolQuote) => isWanted(toolQuote.coverageKind, toolQuote.isIncluded))
						.map((toolQuote) => toolQuote.toolKey);
				return {
					invitationId: invitation.invitationId,
					groupName: invitation.groupName,
					includedToolKeys: toolKeysByCoverage((_, isIncluded) => isIncluded),
					reducedToolKeys: toolKeysByCoverage((coverageKind, isIncluded) => !isIncluded && coverageKind !== 'none')
				};
			})
		)
	};
}
