import { composeLeaveDecisionEmail, composeLeaveRequestEmail } from '@crystal-pharm/email';
import { listEmployees } from '@crystal-pharm/pharmacy-db';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import * as v from 'valibot';
import { addDays, getMondayOfWeek, toCalendarDay, toIsoDate } from '../../../domain/calendar/week';
import { buildGenerationInput } from '../../../domain/generation/generationInput';
import {
	countLeaveDays,
	describeLeave,
	doLeavesOverlap,
	maximumLeaveDays,
	requestableLeaveKinds,
	type LeaveRequest
} from '../../../domain/leave/leaveRequests';
import { assessLeaveStaffingImpact, type LeaveStaffingImpact } from '../../../domain/leave/leaveStaffingImpact';
import {
	deleteLeaveRequest,
	findLeaveRequest,
	insertLeaveRequest,
	listPendingLeaveRequests,
	listUpcomingLeaveRequestsOfEmployee,
	updateLeaveRequestStatus
} from '../../repositories/leaveRequestRepository';
import { insertPlanningNotices } from '../../repositories/planningNoticeRepository';
import { deleteShiftsOfEmployeeBetween } from '../../repositories/planningRepository';
import {
	buildPharmacyUrl,
	findAccountOfEmployee,
	listPlanningManagers,
	myPlanningPathname,
	sendIfHasEmail,
	teamPlanningPathname
} from '../notifications/planningManagers';
import { loadLiveWeekInput } from '../week/weekIssuesService';

export type LeaveSubmission = { kind: string; firstDate: string; lastDate: string; note: string };

export type LeaveRequester = { accountId: string; employeeId: string };

export type LeaveRequestResult =
	| { isSaved: true; staffingImpact: LeaveStaffingImpact }
	| { isSaved: false; message: string };

export type LeaveChangeResult = { isSaved: true } | { isSaved: false; message: string };

const IsoDateSchema = v.pipe(v.string(), v.isoDate('Choisissez un jour.'));

const LeaveSubmissionSchema = v.pipe(
	v.object({
		kind: v.picklist(requestableLeaveKinds, 'Choisissez le type de congé.'),
		firstDate: IsoDateSchema,
		lastDate: IsoDateSchema,
		note: v.pipe(v.string(), v.maxLength(200, 'La note est limitée à 200 caractères.'))
	}),
	v.check(({ firstDate, lastDate }) => firstDate <= lastDate, 'Le dernier jour doit venir après le premier.'),
	v.check(
		(leave) => countLeaveDays(leave) <= maximumLeaveDays,
		`Une demande couvre au plus ${maximumLeaveDays} jours : faites-en plusieurs, ou parlez-en à votre titulaire.`
	)
);

/**
 * Un employé demande un congé : il attend la réponse d'un titulaire, prévenu par la cloche et par email.
 * L'effectif est jugé tout de suite, pour que le titulaire sache en un coup d'œil s'il peut l'accepter.
 */
export async function requestLeave(
	tenantId: string,
	requester: LeaveRequester,
	submission: LeaveSubmission
): Promise<LeaveRequestResult> {
	const parsed = v.safeParse(LeaveSubmissionSchema, submission);
	if (!parsed.success) return { isSaved: false, message: parsed.issues[0].message };
	const { kind, firstDate, lastDate } = parsed.output;
	const note = parsed.output.note.trim();

	const today = toIsoDate(toCalendarDay(new Date()));
	if (firstDate < today) return { isSaved: false, message: 'Un congé se demande pour un jour à venir.' };
	const existingLeaves = await listUpcomingLeaveRequestsOfEmployee(tenantId, requester.employeeId, today);
	const overlappingLeave = existingLeaves.find(
		(leave) => leave.status !== 'declined' && doLeavesOverlap(leave, { firstDate, lastDate })
	);
	if (overlappingLeave) return { isSaved: false, message: `Vous avez déjà demandé : ${describeLeave(overlappingLeave)}.` };

	const newLeave = { employeeId: requester.employeeId, kind, firstDate, lastDate, note };
	await insertLeaveRequest(tenantId, newLeave);
	const staffingImpact = await assessLeaveRequestStaffing(tenantId, newLeave);
	await notifyManagersOfLeaveRequest(tenantId, requester, newLeave, staffingImpact);
	return { isSaved: true, staffingImpact };
}

/** Ce que deviendrait l'effectif de chaque semaine touchée sans la personne. */
export async function assessLeaveRequestStaffing(
	tenantId: string,
	leave: Pick<LeaveRequest, 'employeeId' | 'firstDate' | 'lastDate' | 'kind'>
): Promise<LeaveStaffingImpact> {
	const weekInputs = await Promise.all(
		listMondaysOfLeave(leave).map(async (monday) => buildGenerationInput(await loadLiveWeekInput(tenantId, monday)))
	);
	return assessLeaveStaffingImpact(weekInputs, leave);
}

function listMondaysOfLeave(leave: Pick<LeaveRequest, 'firstDate' | 'lastDate'>): Date[] {
	const mondays: Date[] = [];
	const lastDay = new Date(`${leave.lastDate}T00:00:00Z`);
	for (let monday = getMondayOfWeek(new Date(`${leave.firstDate}T00:00:00Z`)); monday <= lastDay; monday = addDays(monday, 7)) {
		mondays.push(monday);
	}
	return mondays;
}

export type PendingLeaveRequest = {
	leave: LeaveRequest;
	employeeName: string;
	summary: string;
	staffingImpact: LeaveStaffingImpact;
	/** Les collègues qui demandent eux aussi des jours de cette période : accepter l'un change le calcul de l'autre. */
	overlappingRequesterNames: string[];
};

export async function listPendingLeaveRequestsWithStaffing(tenantId: string): Promise<PendingLeaveRequest[]> {
	const [pendingLeaves, employees] = await Promise.all([listPendingLeaveRequests(tenantId), listEmployees(tenantId)]);
	const nameOf = (employeeId: string) => {
		const employee = employees.find((candidate) => candidate.employeeId === employeeId);
		return employee ? formatEmployeeFullName(employee) : undefined;
	};
	return Promise.all(
		pendingLeaves.flatMap((leave) => {
			const employeeName = nameOf(leave.employeeId);
			if (!employeeName) return [];
			const overlappingRequesterNames = pendingLeaves
				.filter((other) => other.id !== leave.id && other.employeeId !== leave.employeeId && doLeavesOverlap(other, leave))
				.flatMap((other) => nameOf(other.employeeId) ?? []);
			return [
				assessLeaveRequestStaffing(tenantId, leave).then((staffingImpact) => ({
					leave,
					employeeName,
					summary: describeLeave(leave),
					staffingImpact,
					overlappingRequesterNames: [...new Set(overlappingRequesterNames)]
				}))
			];
		})
	);
}

export async function listUpcomingLeavesOfEmployee(tenantId: string, employeeId: string): Promise<LeaveRequest[]> {
	return listUpcomingLeaveRequestsOfEmployee(tenantId, employeeId, toIsoDate(toCalendarDay(new Date())));
}

/**
 * Accepter un congé retire les créneaux que la personne avait sur ces jours (jamais ceux du passé) :
 * le planning montre alors les trous, que « Proposer la semaine » comble.
 */
export async function decideLeaveRequest(
	tenantId: string,
	leaveRequestId: string,
	decision: 'approved' | 'declined'
): Promise<LeaveChangeResult> {
	if (!v.is(v.pipe(v.string(), v.uuid()), leaveRequestId)) return { isSaved: false, message: 'Cette demande n’existe plus.' };
	const leave = await findLeaveRequest(tenantId, leaveRequestId);
	if (!leave) return { isSaved: false, message: 'Cette demande n’existe plus.' };
	if (leave.status !== 'pending') return { isSaved: true };

	await updateLeaveRequestStatus(tenantId, leaveRequestId, decision);
	if (decision === 'approved') {
		const today = toIsoDate(toCalendarDay(new Date()));
		const firstFreedDate = leave.firstDate < today ? today : leave.firstDate;
		if (firstFreedDate <= leave.lastDate) {
			await deleteShiftsOfEmployeeBetween(tenantId, leave.employeeId, firstFreedDate, leave.lastDate);
		}
	}
	await notifyEmployeeOfLeaveDecision(tenantId, leave, decision === 'approved');
	return { isSaved: true };
}

/** Un employé retire sa demande tant qu'elle attend ; une fois tranchée, il en parle au titulaire. */
export async function cancelLeaveRequest(
	tenantId: string,
	requester: LeaveRequester,
	leaveRequestId: string
): Promise<LeaveChangeResult> {
	if (!v.is(v.pipe(v.string(), v.uuid()), leaveRequestId)) return { isSaved: true };
	const leave = await findLeaveRequest(tenantId, leaveRequestId);
	if (!leave) return { isSaved: true };
	if (leave.employeeId !== requester.employeeId) return { isSaved: false, message: 'Vous ne pouvez retirer que vos propres demandes.' };
	if (leave.status !== 'pending') return { isSaved: false, message: 'Cette demande a déjà reçu une réponse : parlez-en à votre titulaire.' };
	await deleteLeaveRequest(tenantId, leaveRequestId);
	return { isSaved: true };
}

/** « Effectif suffisant » ou la liste de ce qui manquerait, pour la cloche et l'email. */
export function describeStaffingVerdict(staffingImpact: LeaveStaffingImpact): string {
	if (staffingImpact.isTeamSufficient) return 'D’après le planning, l’équipe reste suffisante sans cette personne.';
	const shortages = staffingImpact.shortages.map((shortage) => shortage.message);
	return `Attention, sans cette personne : ${shortages.join(' ')}`;
}

async function notifyManagersOfLeaveRequest(
	tenantId: string,
	requester: LeaveRequester,
	leave: Omit<LeaveRequest, 'id' | 'status'>,
	staffingImpact: LeaveStaffingImpact
): Promise<void> {
	const [managers, employees] = await Promise.all([
		listPlanningManagers(tenantId, requester.accountId),
		listEmployees(tenantId)
	]);
	const employee = employees.find((candidate) => candidate.employeeId === leave.employeeId);
	const employeeName = employee ? formatEmployeeFullName(employee) : 'Un employé';
	const summary = describeLeave(leave);
	const verdict = staffingImpact.isTeamSufficient ? 'effectif suffisant' : 'il manquerait du monde';
	await insertPlanningNotices(
		tenantId,
		managers.map((manager) => ({
			recipientAccountId: manager.accountId,
			kind: 'leave-requested' as const,
			message: `${employeeName} demande : ${summary} (${verdict}).`,
			linkPathname: teamPlanningPathname
		}))
	);
	await Promise.all(
		managers.flatMap((manager) =>
			sendIfHasEmail(manager, (to) =>
				composeLeaveRequestEmail({
					to,
					employeeName,
					summary,
					staffingVerdict: describeStaffingVerdict(staffingImpact),
					reviewUrl: buildPharmacyUrl(teamPlanningPathname)
				})
			)
		)
	);
}

async function notifyEmployeeOfLeaveDecision(tenantId: string, leave: LeaveRequest, isApproved: boolean): Promise<void> {
	const account = await findAccountOfEmployee(tenantId, leave.employeeId);
	if (!account) return;
	const summary = describeLeave(leave);
	await insertPlanningNotices(tenantId, [
		{
			recipientAccountId: account.accountId,
			kind: 'leave-decided',
			message: `${summary} : ${isApproved ? 'accepté' : 'refusé'}.`,
			linkPathname: myPlanningPathname
		}
	]);
	const employeeFirstName = account.name.split(' ')[0] ?? account.name;
	await Promise.all(
		sendIfHasEmail(account, (to) =>
			composeLeaveDecisionEmail({ to, employeeFirstName, summary, isApproved, myPlanningUrl: buildPharmacyUrl(myPlanningPathname) })
		)
	);
}
