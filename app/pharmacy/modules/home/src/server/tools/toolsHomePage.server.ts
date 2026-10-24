import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getToolAccessOfTenant, previewGroupJoining } from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { findCurrentGroupOfTenant, listPendingInvitationsForAccountEmail } from '@crystal-pharm/group-db';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { describeToolCards } from '../../domain/toolCards';
import type { ToolsHomePageData } from '../../pages/tools-home/toolsHomePageData';
import { requireActiveTenantId, requireSignedInAccountId } from '../activeTenant.server';
import { buildTodayOverview, buildTodayTasks, type TodayOverviewInput } from './today/todayOverview';
import type { TodaySources } from './today/todaySources';

/** `todaySources` : les fonctions du planning et des rendez-vous, passées par `pharmacy/host`. */
export async function loadToolsHomePage(
	{ locals }: { locals: { user: AuthenticatedUser | null } },
	todaySources: TodaySources
): Promise<ToolsHomePageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const accountEmail = locals.user?.email ?? '';
	const [toolAccess, currentGroup, pendingInvitations, pharmacyProfile] = await Promise.all([
		getToolAccessOfTenant(tenantId),
		findCurrentGroupOfTenant(tenantId),
		listPendingInvitationsForAccountEmail(accountEmail),
		getPharmacyProfile(tenantId)
	]);
	const todayInput = await readToday(
		{ accountId: requireSignedInAccountId(locals.user), tenantId },
		toolAccess.accessibleToolKeys,
		todaySources
	);
	return {
		greetingName: readFirstName(locals.user),
		today: buildTodayOverview(todayInput),
		tasks: buildTodayTasks(todayInput, pharmacyProfile.weeklyOpeningSchedule === undefined),
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

async function readToday(
	manager: { accountId: string; tenantId: string },
	accessibleToolKeys: readonly ToolKey[],
	todaySources: TodaySources
): Promise<TodayOverviewInput> {
	const now = new Date();
	const isoDate = toLocalIsoDate(now);
	const [teamSummary, appointmentsSummary] = await Promise.all([
		accessibleToolKeys.includes('planning') ? todaySources.team.getTodayTeam(manager.tenantId, isoDate) : undefined,
		accessibleToolKeys.includes('booking') ? readAppointmentsOrNothing(todaySources, manager, isoDate) : undefined
	]);
	return {
		isoDate,
		nowMinutes: now.getHours() * 60 + now.getMinutes(),
		team: teamSummary && { href: todaySources.team.href, summary: teamSummary },
		appointments: accessibleToolKeys.includes('booking')
			? { href: todaySources.appointments.href, summary: appointmentsSummary }
			: undefined
	};
}

// L'accueil reste utilisable quand le C# ne répond pas : la journée le signale, sans le détail de l'erreur.
async function readAppointmentsOrNothing(
	todaySources: TodaySources,
	manager: { accountId: string; tenantId: string },
	isoDate: string
): Promise<Awaited<ReturnType<TodaySources['appointments']['getTodayAppointments']>> | undefined> {
	try {
		return await todaySources.appointments.getTodayAppointments(manager, isoDate);
	} catch {
		return undefined;
	}
}

function toLocalIsoDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** « Léa » de « Léa Garcia » : le compte ne garde pas le prénom à part dans la session. */
function readFirstName(user: AuthenticatedUser | null): string {
	return user?.name.split(' ')[0] ?? '';
}
