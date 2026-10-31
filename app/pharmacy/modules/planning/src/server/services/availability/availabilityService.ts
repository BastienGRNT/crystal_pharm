import { composeAvailabilityDecisionEmail, composeAvailabilityRequestEmail } from '@crystal-pharm/email';
import { listEmployees } from '@crystal-pharm/pharmacy-db';
import { formatEmployeeFullName } from '@crystal-pharm/pharmacy-db/domain';
import * as v from 'valibot';
import {
	availabilityKinds,
	decideInitialStatus,
	describeAvailabilityRule,
	type AvailabilityRule
} from '../../../domain/availability/availabilityRules';
import { buildDefaultEmployeeTerms } from '../../../domain/rules/employeeTerms';
import {
	deleteAvailabilityRule,
	findAvailabilityRule,
	insertAvailabilityRule,
	listAvailabilityRules,
	updateAvailabilityRuleStatus
} from '../../repositories/availabilityRuleRepository';
import { findEmployeeTerms } from '../../repositories/employeeTermsRepository';
import { insertPlanningNotices } from '../../repositories/planningNoticeRepository';
import {
	buildPharmacyUrl,
	findAccountOfEmployee,
	listPlanningManagers,
	myPlanningPathname,
	sendIfHasEmail,
	teamPlanningPathname
} from '../notifications/planningManagers';

export type AvailabilitySubmission = {
	kind: string;
	recurrence: string;
	weekday: string;
	date: string;
	startTime: string;
	endTime: string;
	note: string;
	/** Seulement lu pour un titulaire, qui déclare pour un autre ; un employé ne déclare que pour lui. */
	employeeId: string;
};

export type AvailabilitySubmitter = { accountId: string; employeeId: string | undefined; canManageTeamPlanning: boolean };

export type AvailabilityChangeResult = { isSaved: true } | { isSaved: false; message: string };

const AvailabilitySubmissionSchema = v.pipe(
	v.object({
		kind: v.picklist(availabilityKinds, 'Choisissez le type.'),
		recurrence: v.picklist(['weekly', 'once'], 'Choisissez si cela revient chaque semaine.'),
		weekday: v.string(),
		date: v.string(),
		startTime: v.pipe(v.string(), v.isoTime('Heure attendue au format HH:MM.')),
		endTime: v.pipe(v.string(), v.isoTime('Heure attendue au format HH:MM.')),
		note: v.pipe(v.string(), v.maxLength(200, 'La note est limitée à 200 caractères.')),
		employeeId: v.string()
	}),
	v.check(({ startTime, endTime }) => startTime < endTime, 'La fin doit venir après le début.'),
	v.check(({ recurrence, date }) => recurrence === 'weekly' || v.is(v.pipe(v.string(), v.isoDate()), date), 'Choisissez le jour.'),
	v.check(
		({ recurrence, weekday }) => recurrence === 'once' || (/^[0-6]$/.test(weekday) && weekday !== ''),
		'Choisissez le jour de la semaine.'
	)
);

export async function submitAvailabilityRule(
	tenantId: string,
	submitter: AvailabilitySubmitter,
	submission: AvailabilitySubmission
): Promise<AvailabilityChangeResult> {
	const parsed = v.safeParse(AvailabilitySubmissionSchema, submission);
	if (!parsed.success) return { isSaved: false, message: parsed.issues[0].message };
	const { kind, recurrence, weekday, date, startTime, endTime, note } = parsed.output;

	const employeeId = submitter.canManageTeamPlanning ? parsed.output.employeeId || submitter.employeeId : submitter.employeeId;
	if (!employeeId) return { isSaved: false, message: 'Aucun employé n’est relié à ce compte.' };
	const employees = await listEmployees(tenantId);
	const employee = employees.find((candidate) => candidate.employeeId === employeeId);
	if (!employee) return { isSaved: false, message: 'Cet employé ne fait pas partie de l’équipe.' };

	const terms = (await findEmployeeTerms(tenantId, employeeId)) ?? buildDefaultEmployeeTerms(employeeId);
	const status = decideInitialStatus(terms.availabilityValidation, submitter.canManageTeamPlanning);
	const newRule = {
		employeeId,
		kind,
		weekday: recurrence === 'weekly' ? Number(weekday) : undefined,
		date: recurrence === 'once' ? date : undefined,
		startTime,
		endTime,
		status,
		note: note.trim()
	};
	await insertAvailabilityRule(tenantId, newRule);

	if (status === 'pending') {
		await notifyManagersOfRequest(tenantId, submitter.accountId, formatEmployeeFullName(employee), {
			...newRule,
			id: ''
		});
	}
	return { isSaved: true };
}

export async function decideAvailabilityRule(
	tenantId: string,
	ruleId: string,
	decision: 'approved' | 'declined'
): Promise<AvailabilityChangeResult> {
	const rule = await findAvailabilityRule(tenantId, ruleId);
	if (!rule) return { isSaved: false, message: 'Cette demande n’existe plus.' };
	if (rule.status !== 'pending') return { isSaved: true };
	await updateAvailabilityRuleStatus(tenantId, ruleId, decision);
	await notifyEmployeeOfDecision(tenantId, rule, decision === 'approved');
	return { isSaved: true };
}

/** Un employé retire les siennes ; un titulaire retire celles de l'équipe. */
export async function removeAvailabilityRule(
	tenantId: string,
	submitter: AvailabilitySubmitter,
	ruleId: string
): Promise<AvailabilityChangeResult> {
	const rule = await findAvailabilityRule(tenantId, ruleId);
	if (!rule) return { isSaved: true };
	if (!submitter.canManageTeamPlanning && rule.employeeId !== submitter.employeeId) {
		return { isSaved: false, message: 'Vous ne pouvez retirer que vos propres demandes.' };
	}
	await deleteAvailabilityRule(tenantId, ruleId);
	return { isSaved: true };
}

export type PendingAvailabilityRequest = { rule: AvailabilityRule; employeeName: string; summary: string };

export async function listPendingAvailabilityRequests(tenantId: string): Promise<PendingAvailabilityRequest[]> {
	const [pendingRules, employees] = await Promise.all([listAvailabilityRules(tenantId, ['pending']), listEmployees(tenantId)]);
	return pendingRules.flatMap((rule) => {
		const employee = employees.find((candidate) => candidate.employeeId === rule.employeeId);
		if (!employee) return [];
		return [{ rule, employeeName: formatEmployeeFullName(employee), summary: describeAvailabilityRule(rule) }];
	});
}

async function notifyManagersOfRequest(
	tenantId: string,
	submitterAccountId: string,
	employeeName: string,
	rule: AvailabilityRule
): Promise<void> {
	const managers = await listPlanningManagers(tenantId, submitterAccountId);
	const summary = describeAvailabilityRule(rule).toLocaleLowerCase('fr');
	await insertPlanningNotices(
		tenantId,
		managers.map((manager) => ({
			recipientAccountId: manager.accountId,
			kind: 'availability-requested' as const,
			message: `${employeeName} : ${summary}.`,
			linkPathname: teamPlanningPathname
		}))
	);
	await Promise.all(managers.flatMap((manager) => sendIfHasEmail(manager, (to) =>
		composeAvailabilityRequestEmail({ to, employeeName, summary, reviewUrl: buildPharmacyUrl(teamPlanningPathname) })
	)));
}

async function notifyEmployeeOfDecision(tenantId: string, rule: AvailabilityRule, isApproved: boolean): Promise<void> {
	const account = await findAccountOfEmployee(tenantId, rule.employeeId);
	if (!account) return;
	const summary = describeAvailabilityRule(rule);
	await insertPlanningNotices(tenantId, [
		{
			recipientAccountId: account.accountId,
			kind: 'availability-decided',
			message: `${summary} : ${isApproved ? 'acceptée' : 'refusée'}.`,
			linkPathname: myPlanningPathname
		}
	]);
	const employeeFirstName = account.name.split(' ')[0] ?? account.name;
	await Promise.all(
		sendIfHasEmail(account, (to) =>
			composeAvailabilityDecisionEmail({
				to,
				employeeFirstName,
				summary,
				isApproved,
				myPlanningUrl: buildPharmacyUrl(myPlanningPathname)
			})
		)
	);
}
