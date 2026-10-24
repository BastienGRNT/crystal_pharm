import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { getToolAccessOfTenant, previewGroupJoining } from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
import { findCurrentGroupOfTenant, listPendingInvitationsForAccountEmail } from '@crystal-pharm/group-db';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { weekdays, type WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { fail, redirect, type ActionFailure } from '@sveltejs/kit';
import { describeToolCards } from '../../domain/toolCards';
import { homePathnames } from '../../homePathnames';
import type { ConfirmAppointmentFailure, ToolsHomePageData } from '../../pages/tools-home/toolsHomePageData';
import { requireActiveTenantId, requireSignedInAccountId } from '../activeTenant.server';
import { appointmentIdFieldName, buildTodayOverview, type TodayOverviewInput } from './today/todayOverview';
import type { TodaySources } from './today/todaySources';

const confirmAppointmentActionName = 'confirmAppointment';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ToolsHomeRequest = { locals: { user: AuthenticatedUser | null } };

/** `todaySources` : les fonctions du planning et des rendez-vous, passées par `pharmacy/host`. */
export async function loadToolsHomePage(
	{ locals }: ToolsHomeRequest,
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
		pharmacyProfile.weeklyOpeningSchedule,
		todaySources
	);
	return {
		greetingName: readFirstName(locals.user),
		today: buildTodayOverview(todayInput),
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
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined,
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
		openingPeriods: weeklyOpeningSchedule && listOpeningPeriodsOfDay(weeklyOpeningSchedule, now),
		team: teamSummary && { href: todaySources.team.href, summary: teamSummary },
		appointments: accessibleToolKeys.includes('booking')
			? { href: todaySources.appointments.href, summary: appointmentsSummary }
			: undefined,
		confirmAppointmentFormAction: `?/${confirmAppointmentActionName}`
	};
}

/** « Confirmer » dans « À traiter » : le rendez-vous est confirmé par le C#, puis l'accueil se recharge. */
export async function confirmAppointmentFromToolsHome(
	{ request, locals }: ToolsHomeRequest & { request: Request },
	todaySources: TodaySources
): Promise<ActionFailure<ConfirmAppointmentFailure>> {
	const tenantId = await requireActiveTenantId(locals.user);
	const { accessibleToolKeys } = await getToolAccessOfTenant(tenantId);
	if (!accessibleToolKeys.includes('booking')) {
		return fail(403, { confirmationFailure: 'Les rendez-vous ne sont pas activés pour votre pharmacie.' });
	}
	const appointmentId = String((await request.formData()).get(appointmentIdFieldName) ?? '');
	if (!uuidPattern.test(appointmentId)) return fail(400, { confirmationFailure: 'Ce rendez-vous est introuvable.' });

	const manager = { accountId: requireSignedInAccountId(locals.user), tenantId };
	const isConfirmed = await todaySources.appointments.confirmAppointment(manager, appointmentId).catch(() => false);
	if (!isConfirmed) {
		return fail(409, { confirmationFailure: 'Ce rendez-vous n’a pas pu être confirmé. Réessayez depuis l’agenda.' });
	}
	redirect(303, homePathnames.toolsHome);
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

function listOpeningPeriodsOfDay(
	weeklyOpeningSchedule: WeeklyOpeningSchedule,
	date: Date
): { startMinutes: number; endMinutes: number }[] {
	const weekday = weekdays[(date.getDay() + 6) % 7];
	return (weekday ? weeklyOpeningSchedule[weekday] : []).map((openingPeriod) => ({
		startMinutes: toMinutesSinceMidnight(openingPeriod.opensAt),
		endMinutes: toMinutesSinceMidnight(openingPeriod.closesAt)
	}));
}

function toMinutesSinceMidnight(timeOfDay: string): number {
	const [hours = 0, minutes = 0] = timeOfDay.split(':').map(Number);
	return hours * 60 + minutes;
}

function toLocalIsoDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** « Léa » de « Léa Garcia » : le compte ne garde pas le prénom à part dans la session. */
function readFirstName(user: AuthenticatedUser | null): string {
	return user?.name.split(' ')[0] ?? '';
}
