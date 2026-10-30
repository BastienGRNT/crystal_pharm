import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { canTenantUseTool } from '@crystal-pharm/billing-db';
import { findActiveTenantMemberAccess } from '@crystal-pharm/pharmacy-db';
import { error, fail, redirect, type Actions } from '@sveltejs/kit';
import { availabilityKindLabels, describeAvailabilityRule } from '../domain/availability/availabilityRules';
import {
	addDays,
	formatDayName,
	formatWeekLabel,
	formatWeekParameter,
	formatWeekRange,
	getMondayOfWeek,
	listWeekDays,
	parseWeekParameter,
	toCalendarDay,
	toIsoDate
} from '../domain/calendar/week';
import { buildPlanningRows, formatDuration, sumPlannedMinutes } from '../domain/planning';
import { buildDefaultEmployeeTerms } from '../domain/rules/employeeTerms';
import type { AddAvailabilityFailure, MyPlanningPageData } from '../pages/myPlanningPageData';
import { listAvailabilityRulesOfEmployee } from './repositories/availabilityRuleRepository';
import { findEmployeeTerms } from './repositories/employeeTermsRepository';
import { listPlanningNoticesOfAccount, markPlanningNoticesAsRead } from './repositories/planningNoticeRepository';
import { requireActiveTenantId } from './activeTenant.server';
import { removeAvailabilityRule, submitAvailabilityRule } from './services/availability/availabilityService';
import { getPlanningOfWeek } from './services/team/teamPlanningService';
import { getWeekStatus } from './services/week/weekStatusService';

type MyPlanningRequest = {
	url: URL;
	locals: { user: AuthenticatedUser | null };
};

const availabilityFieldNames = ['kind', 'recurrence', 'weekday', 'date', 'startTime', 'endTime', 'note'] as const;

/** Ce que voit l'Employee relié au compte : sans Responsibility, mais seulement si la pharmacie a activé le planning. */
async function requireEmployeeOfPlanning(user: AuthenticatedUser | null) {
	const tenantId = await requireActiveTenantId(user);
	const access = user && (await findActiveTenantMemberAccess(user.userId));
	if (!access?.employeeId) redirect(303, '/');
	if (!(await canTenantUseTool(tenantId, 'planning'))) error(404, 'Not found');
	return { tenantId, accountId: access.accountId, employeeId: access.employeeId };
}

export async function load({ url, locals }: MyPlanningRequest): Promise<MyPlanningPageData> {
	const { tenantId, accountId, employeeId } = await requireEmployeeOfPlanning(locals.user);
	const today = toCalendarDay(new Date());
	const monday = parseWeekParameter(url.searchParams.get('week'), today);
	const weekDates = listWeekDays(monday).map(toIsoDate);

	const [weekPlanning, weekStatus, rules, terms, notices] = await Promise.all([
		getPlanningOfWeek(tenantId, monday),
		getWeekStatus(tenantId, monday),
		listAvailabilityRulesOfEmployee(tenantId, employeeId),
		findEmployeeTerms(tenantId, employeeId),
		listPlanningNoticesOfAccount(tenantId, accountId)
	]);
	await markPlanningNoticesAsRead(tenantId, accountId);

	const isWeekPublished = weekStatus === 'published';
	const myRow = buildPlanningRows(weekPlanning, weekDates).find((row) => row.employee.id === employeeId);
	const myShifts = isWeekPublished ? weekPlanning.shifts.filter((shift) => shift.employeeId === employeeId) : [];

	return {
		firstName: myRow?.employee.fullName.split(' ')[0] ?? '',
		periodLabel: `${formatWeekLabel(monday)} · ${formatWeekRange(monday)}`,
		previousWeekHref: `?week=${formatWeekParameter(addDays(monday, -7))}`,
		nextWeekHref: `?week=${formatWeekParameter(addDays(monday, 7))}`,
		todayHref: toIsoDate(getMondayOfWeek(today)) === toIsoDate(monday) ? undefined : '?',
		isWeekPublished,
		days: (myRow?.cells ?? []).map((cell) => ({
			date: cell.date,
			title: `${formatDayName(new Date(`${cell.date}T00:00:00Z`))} ${Number(cell.date.slice(8))}`,
			isToday: cell.date === toIsoDate(today),
			shiftLabels: isWeekPublished ? cell.shifts.map((shift) => `${shift.startTime} – ${shift.endTime}`) : [],
			absenceLabel: cell.absenceKind
		})),
		plannedDurationLabel: formatDuration(sumPlannedMinutes(myShifts)),
		rules: rules.map((rule) => ({
			id: rule.id,
			kind: rule.kind,
			kindLabel: availabilityKindLabels[rule.kind],
			summary: describeAvailabilityRule(rule),
			note: rule.note,
			status: rule.status
		})),
		notices: notices.map(({ id, message, isRead }) => ({ id, message, isRead })),
		isAvailabilityAutomaticallyValidated:
			(terms ?? buildDefaultEmployeeTerms(employeeId)).availabilityValidation === 'automatic',
		addAvailabilityFormAction: '?/addAvailability',
		removeAvailabilityFormAction: '?/removeAvailability'
	};
}

export const actions = {
	addAvailability: async ({ request, locals }) => {
		const { tenantId, accountId, employeeId } = await requireEmployeeOfPlanning(locals.user);
		const formData = await request.formData();
		const values = Object.fromEntries(
			availabilityFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '')])
		) as Record<(typeof availabilityFieldNames)[number], string>;

		const saveResult = await submitAvailabilityRule(
			tenantId,
			{ accountId, employeeId, canManageTeamPlanning: false },
			{ ...values, employeeId }
		);
		if (!saveResult.isSaved) return fail(400, { message: saveResult.message, values } satisfies AddAvailabilityFailure);
	},

	removeAvailability: async ({ request, locals }) => {
		const { tenantId, accountId, employeeId } = await requireEmployeeOfPlanning(locals.user);
		const formData = await request.formData();
		const removeResult = await removeAvailabilityRule(
			tenantId,
			{ accountId, employeeId, canManageTeamPlanning: false },
			String(formData.get('ruleId') ?? '')
		);
		if (!removeResult.isSaved) return fail(400, { message: removeResult.message, values: {} } satisfies AddAvailabilityFailure);
	}
} satisfies Actions;
