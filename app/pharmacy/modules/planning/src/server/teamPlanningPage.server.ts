import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { SegmentedControlOption } from '@crystal-pharm/ui';
import { formatTimeOfDay, spanOpeningPeriods } from '../domain/coverage/coverage';
import {
	buildPlanningRows,
	formatDuration,
	formatShiftHours,
	sumPlannedMinutes,
	toMinutesSinceMidnight,
	type PlanningRow,
	type Shift,
	type WeekPlanning
} from '../domain/planning';
import {
	computeTimelineRange,
	listTimelineHours,
	toTimelineBarPosition,
	toTimelinePercent,
	type TimelineRange
} from '../domain/calendar/timeline';
import {
	addDays,
	formatDayName,
	formatDayTitle,
	formatWeekLabel,
	formatWeekParameter,
	formatWeekRange,
	getMondayOfWeek,
	listWeekDays,
	parseDayParameter,
	parseWeekParameter,
	toCalendarDay,
	toIsoDate
} from '../domain/calendar/week';
import type { Actions } from '@sveltejs/kit';
import type {
	AddShiftFailure,
	CommonPlanningPageData,
	DayViewData,
	FormActions,
	PlanningPageData,
	WeekGenerationFeedback,
	WeekViewData
} from '../pages/teamPlanningPageData';
import { requirePlanningManager } from './activeTenant.server';
import {
	addShift,
	getPlanningOfWeek,
	getWeekPlanning,
	listOpeningPeriodsByDate,
	removeShift,
	updateShift,
	type ShiftSubmission
} from './services/team/teamPlanningService';
import { decideAvailabilityRule, listPendingAvailabilityRequests } from './services/availability/availabilityService';
import { addPlannedActivity, removePlannedActivity, type PlannedActivitySubmission } from './services/activities/plannedActivityService';
import { decideLeaveRequest, listPendingLeaveRequestsWithStaffing } from './services/leave/leaveRequestService';
import { applyWeekTemplate, findWeekTemplates, saveWeekAsTemplate } from './services/templates/weekTemplateService';
import { summarizeWeekTemplate } from '../domain/templates/weekTemplates';
import { generateWeekPlanning } from './services/generation/weekGenerationService';
import { loadLiveWeekInput } from './services/week/weekIssuesService';
import { getWeekStatus, publishWeek, returnWeekToDraft } from './services/week/weekStatusService';

const shiftFieldNames = ['employeeId', 'date', 'startTime', 'endTime'] as const;
const activityFieldNames = ['employeeId', 'kind', 'date', 'startTime', 'endTime', 'label'] as const;

const weekHref = (monday: Date): string => `?view=week&week=${formatWeekParameter(monday)}`;
const dayHref = (day: Date): string => `?view=day&day=${toIsoDate(day)}`;

const panelQueryKeys = new Set(['add', 'edit', 'template', 'activities', 'tools', 'pending']);

/** La requête de la vue affichée, sans le panneau ni le nom d'une action de formulaire. */
function readPageQuery(url: URL): URLSearchParams {
	const pageQuery = new URLSearchParams(url.searchParams);
	for (const key of [...pageQuery.keys()]) {
		if (panelQueryKeys.has(key) || key.startsWith('/')) pageQuery.delete(key);
	}
	return pageQuery;
}

function toPageHref(url: URL, pageQuery: URLSearchParams): string {
	const query = pageQuery.toString();
	return query ? `${url.pathname}?${query}` : url.pathname;
}

function toActionHref(pageQuery: URLSearchParams, actionName: string): string {
	const query = pageQuery.toString();
	return query ? `?${query}&/${actionName}` : `?/${actionName}`;
}

function withQueryParameter(pageQuery: URLSearchParams, key: string, value: string): URLSearchParams {
	const extendedQuery = new URLSearchParams(pageQuery);
	extendedQuery.set(key, value);
	return extendedQuery;
}

function buildFormActions(url: URL): FormActions {
	const pageQuery = readPageQuery(url);
	const pageHref = toPageHref(url, pageQuery);
	const pageQueryWithAddPanel = withQueryParameter(pageQuery, 'add', '1');
	const pageQueryWithSavePanel = withQueryParameter(pageQuery, 'template', 'save');
	const pageQueryWithActivitiesPanel = withQueryParameter(pageQuery, 'activities', '1');
	const pageQueryWithPendingPanel = withQueryParameter(pageQuery, 'pending', '1');
	const editedShiftId = url.searchParams.get('edit');

	return {
		toolsPanel: {
			isOpen: url.searchParams.get('tools') === '1',
			openHref: toPageHref(url, withQueryParameter(pageQuery, 'tools', '1')),
			closeHref: pageHref
		},
		pendingPanel: {
			isOpen: url.searchParams.get('pending') === '1',
			openHref: toPageHref(url, pageQueryWithPendingPanel),
			closeHref: pageHref
		},
		saveTemplatePanel: {
			isOpen: url.searchParams.get('template') === 'save',
			openHref: toPageHref(url, pageQueryWithSavePanel),
			closeHref: pageHref
		},
		applyTemplatePanel: {
			isOpen: url.searchParams.get('template') === 'apply',
			openHref: toPageHref(url, withQueryParameter(pageQuery, 'template', 'apply')),
			closeHref: pageHref
		},
		generateWeekFormAction: toActionHref(pageQuery, 'generateWeek'),
		saveTemplateFormAction: toActionHref(pageQueryWithSavePanel, 'saveTemplate'),
		applyTemplateFormAction: toActionHref(pageQuery, 'applyTemplate'),
		addShiftPanel: {
			isOpen: url.searchParams.get('add') === '1',
			openHref: toPageHref(url, pageQueryWithAddPanel),
			closeHref: pageHref
		},
		// Les valeurs du créneau ouvert sont posées par la vue, qui connaît ceux de la période.
		editShiftPanel: editedShiftId
			? { closeHref: pageHref, shiftId: editedShiftId, values: { employeeId: '', date: '', startTime: '', endTime: '' } }
			: undefined,
		// Un ajout refusé garde le panneau ouvert avec son message ; un envoi réussi revient à la vue affichée.
		addShiftFormAction: toActionHref(pageQueryWithAddPanel, 'addShift'),
		editShiftHrefPrefix: toPageHref(url, withQueryParameter(pageQuery, 'edit', '')),
		updateShiftFormAction: toActionHref(editedShiftId ? withQueryParameter(pageQuery, 'edit', editedShiftId) : pageQuery, 'updateShift'),
		deleteShiftFormAction: toActionHref(pageQuery, 'deleteShift'),
		decideAvailabilityFormAction: toActionHref(pageQueryWithPendingPanel, 'decideAvailability'),
		decideLeaveFormAction: toActionHref(pageQueryWithPendingPanel, 'decideLeave'),
		activitiesPanel: {
			isOpen: url.searchParams.get('activities') === '1',
			openHref: toPageHref(url, pageQueryWithActivitiesPanel),
			closeHref: pageHref
		},
		addActivityFormAction: toActionHref(pageQueryWithActivitiesPanel, 'addActivity'),
		removeActivityFormAction: toActionHref(pageQueryWithActivitiesPanel, 'removeActivity'),
		publishWeekFormAction: toActionHref(pageQuery, 'publishWeek'),
		returnWeekToDraftFormAction: toActionHref(pageQuery, 'returnWeekToDraft')
	};
}

type PlanningRequest = {
	url: URL;
	locals: { user: AuthenticatedUser | null };
};

// La journée est la vue par défaut ; un ancien lien `?week=` sans `view` ouvre encore la semaine.
function isWeekViewRequested(url: URL): boolean {
	return url.searchParams.get('view') === 'week' || (!url.searchParams.has('view') && url.searchParams.has('week'));
}

/** Le lundi de la semaine affichée, que la vue soit une semaine ou une journée. */
function readMondayOfDisplayedWeek(url: URL): Date {
	const today = toCalendarDay(new Date());
	return isWeekViewRequested(url)
		? parseWeekParameter(url.searchParams.get('week'), today)
		: getMondayOfWeek(parseDayParameter(url.searchParams.get('day'), today));
}

export async function load({ url, locals }: PlanningRequest): Promise<PlanningPageData> {
	const { tenantId } = await requirePlanningManager(locals.user);
	const now = new Date();
	const today = toCalendarDay(now);
	const formActions = buildFormActions(url);

	if (isWeekViewRequested(url)) {
		const monday = parseWeekParameter(url.searchParams.get('week'), today);
		return loadWeekView(tenantId, monday, today, formActions);
	}

	const day = parseDayParameter(url.searchParams.get('day'), today);
	return loadDayView(tenantId, day, today, now, formActions);
}

/** Le panneau de modification s'ouvre sur les valeurs du créneau ; un créneau supprimé entre-temps le referme. */
function withEditedShiftValues(formActions: FormActions, shifts: Shift[]): FormActions {
	const { editShiftPanel } = formActions;
	if (!editShiftPanel) return formActions;
	const editedShift = shifts.find((shift) => shift.id === editShiftPanel.shiftId);
	if (!editedShift) return { ...formActions, editShiftPanel: undefined };
	const { employeeId, date, startTime, endTime } = editedShift;
	return { ...formActions, editShiftPanel: { ...editShiftPanel, values: { employeeId, date, startTime, endTime } } };
}

type WeekContext = Pick<
	CommonPlanningPageData,
	'weekStatus' | 'settingsHref' | 'pendingAvailabilityRequests' | 'pendingLeaveRequests' | 'templates' | 'live' | 'dayHrefPrefix'
>;

/** Ce qui vaut pour toute la semaine, qu'on regarde la semaine ou une de ses journées. */
async function loadWeekContext(tenantId: string, monday: Date): Promise<WeekContext> {
	const [status, live, pendingRequests, pendingLeaveRequests, templates] = await Promise.all([
		getWeekStatus(tenantId, monday),
		loadLiveWeekInput(tenantId, monday),
		listPendingAvailabilityRequests(tenantId),
		listPendingLeaveRequestsWithStaffing(tenantId),
		findWeekTemplates(tenantId)
	]);
	return {
		templates: templates.map(summarizeWeekTemplate),
		pendingAvailabilityRequests: pendingRequests.map(({ rule, employeeName, summary }) => ({
			ruleId: rule.id,
			employeeName,
			summary,
			note: rule.note
		})),
		pendingLeaveRequests: pendingLeaveRequests.map(({ leave, employeeName, summary, staffingImpact, overlappingRequesterNames }) => ({
			leaveRequestId: leave.id,
			employeeName,
			summary,
			note: leave.note,
			isTeamSufficient: staffingImpact.isTeamSufficient,
			shortages: staffingImpact.shortages.map((shortage) => shortage.message),
			overlappingRequesterNames
		})),
		weekStatus: { isDraft: status === 'draft', mondayDate: toIsoDate(monday) },
		settingsHref: '/planning/parametres',
		live,
		dayHrefPrefix: dayHref(new Date(0)).replace(/day=.*/, 'day=')
	};
}

function buildViewOptions(currentView: 'week' | 'day', monday: Date, dayInWeek: Date): SegmentedControlOption[] {
	return [
		{ label: 'Journée', href: dayHref(dayInWeek), icon: 'clock', isCurrent: currentView === 'day' },
		{ label: 'Semaine', href: weekHref(monday), icon: 'calendar-dots', isCurrent: currentView === 'week' }
	];
}

async function loadWeekView(
	tenantId: string,
	monday: Date,
	today: Date,
	formActions: FormActions
): Promise<WeekViewData> {
	const weekDays = listWeekDays(monday);
	const weekDates = weekDays.map(toIsoDate);
	const [weekPlanning, weekContext] = await Promise.all([
		getPlanningOfWeek(tenantId, monday),
		loadWeekContext(tenantId, monday)
	]);
	const todayIsInWeek = weekDates.includes(toIsoDate(today));

	return {
		view: 'week',
		...withEditedShiftValues(formActions, weekPlanning.shifts),
		...weekContext,
		viewOptions: buildViewOptions('week', monday, todayIsInWeek ? today : monday),
		periodNavigation: {
			label: formatWeekLabel(monday),
			previousHref: weekHref(addDays(monday, -7)),
			nextHref: weekHref(addDays(monday, 7)),
			navigationLabel: 'Semaine affichée',
			previousLabel: 'Semaine précédente',
			nextLabel: 'Semaine suivante',
			todayHref: todayIsInWeek ? undefined : weekHref(getMondayOfWeek(today))
		},
		title: formatWeekRange(monday),
		context: `${formatDuration(sumPlannedMinutes(weekPlanning.shifts))} planifiées`,
		defaultShiftDate: toIsoDate(monday),
		employees: weekPlanning.employees,
		todayDate: toIsoDate(today)
	};
}

async function loadDayView(
	tenantId: string,
	day: Date,
	today: Date,
	now: Date,
	formActions: FormActions
): Promise<DayViewData> {
	const date = toIsoDate(day);
	const [dayPlanning, [openingPeriods = []], weekContext] = await Promise.all([
		getWeekPlanning(tenantId, date, date),
		listOpeningPeriodsByDate(tenantId, [date]),
		loadWeekContext(tenantId, getMondayOfWeek(day))
	]);
	const planningRows = buildPlanningRows(dayPlanning, [date]);
	const openingHours = spanOpeningPeriods(openingPeriods);
	const timelineRange = computeTimelineRange(dayPlanning.shifts, openingHours);
	const isToday = date === toIsoDate(today);
	const currentTime = formatTimeOfDay(now.getHours() * 60 + now.getMinutes());
	const presentEmployeeCount = countPresentEmployees(planningRows);

	return {
		view: 'day',
		...withEditedShiftValues(formActions, dayPlanning.shifts),
		...weekContext,
		viewOptions: buildViewOptions('day', getMondayOfWeek(day), day),
		periodNavigation: {
			label: `${formatDayName(day)} ${day.getUTCDate()}`,
			previousHref: dayHref(addDays(day, -1)),
			nextHref: dayHref(addDays(day, 1)),
			navigationLabel: 'Journée affichée',
			previousLabel: 'Jour précédent',
			nextLabel: 'Jour suivant',
			todayHref: isToday ? undefined : dayHref(today)
		},
		title: formatDayTitle(day),
		context: `${formatStaffCount(presentEmployeeCount)} · ${formatDuration(sumPlannedMinutes(dayPlanning.shifts))} planifiées`,
		defaultShiftDate: date,
		employees: dayPlanning.employees,
		timelineMinutes: timelineRange,
		date,
		hours: listTimelineHours(timelineRange).map((hour) => ({
			label: `${hour}:00`,
			percent: toTimelinePercent(hour * 60, timelineRange)
		})),
		rows: sortPharmaciansFirst(planningRows).map(({ employee, cells }) => {
			const cell = cells[0];
			return {
				key: employee.id,
				employeeId: employee.id,
				personName: employee.fullName,
				personDetail: employee.jobTitle,
				personHours: formatDuration(sumPlannedMinutes(cell?.shifts ?? [])),
				personTag: employee.isPharmacist ? 'Ph' : undefined,
				absence: cell?.absenceKind ? { label: 'Absent', detail: cell.absenceKind } : undefined,
				bars: (cell?.shifts ?? []).map((shift) => ({
					id: shift.id,
					label: formatShiftHours(shift),
					tone: employee.isPharmacist ? 'strong' : 'soft',
					startTime: shift.startTime,
					endTime: shift.endTime,
					editHref: `${formActions.editShiftHrefPrefix}${shift.id}`,
					...toTimelineBarPosition(shift, timelineRange)
				}))
			};
		}),
		opening: openingHours && {
			startPercent: toTimelinePercent(toMinutesSinceMidnight(openingHours.opensAt), timelineRange),
			endPercent: toTimelinePercent(toMinutesSinceMidnight(openingHours.closesAt), timelineRange)
		},
		now: isToday
			? { percent: toTimelinePercent(toMinutesSinceMidnight(currentTime), timelineRange), label: currentTime }
			: undefined
	};
}

/** Sur une ligne d'une seule journée : présent s'il y a des créneaux et pas d'absence. */
function countPresentEmployees(planningRows: PlanningRow[]): number {
	return planningRows.filter((planningRow) => {
		const [cell] = planningRow.cells;
		return cell !== undefined && cell.absenceKind === undefined && cell.shifts.length > 0;
	}).length;
}

function formatStaffCount(staffCount: number): string {
	if (staffCount === 0) return 'Personne';
	return staffCount === 1 ? '1 personne' : `${staffCount} personnes`;
}

function sortPharmaciansFirst(planningRows: PlanningRow[]): PlanningRow[] {
	return [...planningRows].sort(
		(first, second) => Number(second.employee.isPharmacist) - Number(first.employee.isPharmacist)
	);
}

const missingShiftFieldMessage = 'Renseignez l’employé, le jour, le début et la fin du créneau.';

function readShiftSubmission(formData: FormData): ShiftSubmission {
	return Object.fromEntries(
		shiftFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '')])
	) as ShiftSubmission;
}

function hasMissingShiftField(values: ShiftSubmission): boolean {
	return shiftFieldNames.some((fieldName) => values[fieldName] === '');
}

function redirectToDisplayedView(url: URL): never {
	redirect(303, toPageHref(url, readPageQuery(url)));
}

function redirectToPendingRequests(url: URL): never {
	redirect(303, toPageHref(url, withQueryParameter(readPageQuery(url), 'pending', '1')));
}

export const actions = {
	addShift: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const values = readShiftSubmission(await request.formData());
		if (hasMissingShiftField(values)) return fail(400, { message: missingShiftFieldMessage, values } satisfies AddShiftFailure);

		const saveResult = await addShift(tenantId, values);
		if (!saveResult.isSaved) return fail(400, { message: saveResult.message, values } satisfies AddShiftFailure);
		redirectToDisplayedView(url);
	},

	updateShift: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const values = readShiftSubmission(formData);
		if (hasMissingShiftField(values)) return fail(400, { message: missingShiftFieldMessage, values } satisfies AddShiftFailure);

		const saveResult = await updateShift(tenantId, String(formData.get('shiftId') ?? ''), values);
		if (!saveResult.isSaved) return fail(400, { message: saveResult.message, values } satisfies AddShiftFailure);
		redirectToDisplayedView(url);
	},

	publishWeek: async ({ url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		await publishWeek(tenantId, readMondayOfDisplayedWeek(url));
		redirectToDisplayedView(url);
	},

	returnWeekToDraft: async ({ url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		await returnWeekToDraft(tenantId, readMondayOfDisplayedWeek(url));
		redirectToDisplayedView(url);
	},

	decideAvailability: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const decision = String(formData.get('decision') ?? '');
		if (decision !== 'approved' && decision !== 'declined') return fail(400, { message: 'Décision inconnue.' });

		await decideAvailabilityRule(tenantId, String(formData.get('ruleId') ?? ''), decision);
		redirectToPendingRequests(url);
	},

	decideLeave: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const decision = String(formData.get('decision') ?? '');
		if (decision !== 'approved' && decision !== 'declined') return fail(400, { message: 'Décision inconnue.' });

		const result = await decideLeaveRequest(tenantId, String(formData.get('leaveRequestId') ?? ''), decision);
		if (!result.isSaved) return fail(400, { message: result.message });
		redirectToPendingRequests(url);
	},

	addActivity: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const values = Object.fromEntries(
			activityFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '')])
		) as PlannedActivitySubmission;

		const result = await addPlannedActivity(tenantId, values);
		if (!result.isSaved) return fail(400, { message: result.message, values } satisfies AddShiftFailure);
		redirect(303, toPageHref(url, withQueryParameter(readPageQuery(url), 'activities', '1')));
	},

	removeActivity: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		await removePlannedActivity(tenantId, String(formData.get('activityId') ?? ''));
		redirect(303, toPageHref(url, withQueryParameter(readPageQuery(url), 'activities', '1')));
	},

	generateWeek: async ({ url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const generationReport = await generateWeekPlanning(tenantId, readMondayOfDisplayedWeek(url));
		return { generationReport, closeHref: toPageHref(url, readPageQuery(url)) } satisfies WeekGenerationFeedback;
	},

	saveTemplate: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const result = await saveWeekAsTemplate(
			tenantId,
			readMondayOfDisplayedWeek(url),
			String(formData.get('name') ?? ''),
			String(formData.get('rotation') ?? 'none')
		);
		if (!result.isSaved) return fail(400, { message: result.message });
		redirectToDisplayedView(url);
	},

	applyTemplate: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const result = await applyWeekTemplate(tenantId, readMondayOfDisplayedWeek(url), String(formData.get('templateId') ?? ''));
		if (!result.isSaved) return fail(400, { message: result.message });
		return { message: result.message ?? '', isSuccess: true };
	},

	deleteShift: async ({ request, url, locals }) => {
		const { tenantId } = await requirePlanningManager(locals.user);
		const formData = await request.formData();
		const slotId = String(formData.get('slotId') ?? '');
		if (slotId === '') return fail(400, { message: 'Créneau introuvable.' });

		await removeShift(tenantId, slotId);
		redirectToDisplayedView(url);
	}
} satisfies Actions;
