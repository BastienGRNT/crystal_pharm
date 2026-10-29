import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { SegmentedControlOption } from '@crystal-pharm/ui';
import type { PlanningTimelineCoverage, PlanningTimelineRow } from '../components/organisms/day/planningTimeline';
import type { PlanningGridRow, PlanningGridSummary } from '../components/organisms/week/planningGrid';
import {
	formatMinuteRange,
	listCoverageGaps,
	spanOpeningPeriods,
	type CoverageSegment,
	type OpeningHours
} from '../domain/coverage/coverage';
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
import type { PlanningIssue } from '../domain/issues/planningIssues';
import type {
	AddShiftFailure,
	CommonPlanningPageData,
	DayViewData,
	FormActions,
	PlanningIssueView,
	PlanningPageData,
	WeekViewData
} from '../pages/teamPlanningPageData';
import { requireActiveTenantId } from './activeTenant.server';
import { computePharmacistCoverage } from './services/team/pharmacistCoverageService';
import {
	addShift,
	getWeekPlanning,
	listOpeningPeriodsByDate,
	removeShift,
	updateShift,
	type ShiftSubmission
} from './services/team/teamPlanningService';
import { findPlanningRules } from './services/settings/planningSettingsService';
import { listWeekIssues } from './services/week/weekIssuesService';
import { getWeekStatus, publishWeek, returnWeekToDraft } from './services/week/weekStatusService';

const shiftFieldNames = ['employeeId', 'date', 'startTime', 'endTime'] as const;

const weekHref = (monday: Date): string => `?view=week&week=${formatWeekParameter(monday)}`;
const dayHref = (day: Date): string => `?view=day&day=${toIsoDate(day)}`;

/** La requête de la vue affichée, sans le panneau ni le nom d'une action de formulaire. */
function readPageQuery(url: URL): URLSearchParams {
	const pageQuery = new URLSearchParams(url.searchParams);
	for (const key of [...pageQuery.keys()]) {
		if (key === 'add' || key === 'edit' || key.startsWith('/')) pageQuery.delete(key);
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

function buildFormActions(url: URL): FormActions {
	const pageQuery = readPageQuery(url);
	const pageQueryWithPanel = new URLSearchParams(pageQuery);
	pageQueryWithPanel.set('add', '1');
	const editedShiftId = url.searchParams.get('edit');
	const pageQueryWithEdit = new URLSearchParams(pageQuery);
	if (editedShiftId) pageQueryWithEdit.set('edit', editedShiftId);

	return {
		addShiftPanel: {
			isOpen: url.searchParams.get('add') === '1',
			openHref: toPageHref(url, pageQueryWithPanel),
			closeHref: toPageHref(url, pageQuery)
		},
		// Les valeurs du créneau ouvert sont posées par la vue, qui connaît ceux de la période.
		editShiftPanel: editedShiftId
			? { closeHref: toPageHref(url, pageQuery), shiftId: editedShiftId, values: { employeeId: '', date: '', startTime: '', endTime: '' } }
			: undefined,
		// Un ajout refusé garde le panneau ouvert avec son message ; un envoi réussi revient à la vue affichée.
		addShiftFormAction: toActionHref(pageQueryWithPanel, 'addShift'),
		editShiftHrefPrefix: toPageHref(url, new URLSearchParams([...pageQuery, ['edit', '']])),
		updateShiftFormAction: toActionHref(pageQueryWithEdit, 'updateShift'),
		deleteShiftFormAction: toActionHref(pageQuery, 'deleteShift'),
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
	const tenantId = await requireActiveTenantId(locals.user);
	const now = new Date();
	const today = toCalendarDay(now);
	const formActions = buildFormActions(url);

	const isWeekView = isWeekViewRequested(url);

	if (isWeekView) {
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

type WeekContext = Pick<CommonPlanningPageData, 'weekStatus' | 'settingsHref'> & { issues: PlanningIssue[] };

/** Ce qui vaut pour toute la semaine, qu'on regarde la semaine ou une de ses journées. */
async function loadWeekContext(tenantId: string, monday: Date): Promise<WeekContext> {
	const [status, issues] = await Promise.all([getWeekStatus(tenantId, monday), listWeekIssues(tenantId, monday)]);
	return {
		weekStatus: { isDraft: status === 'draft', mondayDate: toIsoDate(monday) },
		settingsHref: '/planning/parametres',
		issues
	};
}

function toIssueView(issue: PlanningIssue): PlanningIssueView {
	return {
		key: issue.key,
		severity: issue.severity,
		message: issue.message,
		dayHref: dayHref(new Date(`${issue.date}T00:00:00Z`))
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
	const [weekPlanning, openingPeriodsByDay, rules, weekContext] = await Promise.all([
		getWeekPlanning(tenantId, weekDates[0] ?? '', weekDates[6] ?? ''),
		listOpeningPeriodsByDate(tenantId, weekDates),
		findPlanningRules(tenantId),
		loadWeekContext(tenantId, monday)
	]);
	const planningRows = buildPlanningRows(weekPlanning, weekDates);
	const todayIsInWeek = weekDates.includes(toIsoDate(today));

	return {
		view: 'week',
		...withEditedShiftValues(formActions, weekPlanning.shifts),
		...weekContext,
		issues: weekContext.issues.map(toIssueView),
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
		days: weekDays.map((day, dayIndex) => ({
			key: toIsoDate(day),
			dayName: formatDayName(day),
			dayNumber: day.getUTCDate(),
			isToday: toIsoDate(day) === toIsoDate(today),
			detail: formatStaffCount(countPresentEmployees(planningRows, dayIndex)),
			href: dayHref(day)
		})),
		rows: planningRows.map((planningRow) => toPlanningGridRow(planningRow, weekPlanning, formActions.editShiftHrefPrefix)),
		pharmacistCoverage: buildWeekPharmacistCoverage(planningRows, weekDates, openingPeriodsByDay, rules.minimumPharmacistsPresent)
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
	const [dayPlanning, [openingPeriods = []], rules, weekContext] = await Promise.all([
		getWeekPlanning(tenantId, date, date),
		listOpeningPeriodsByDate(tenantId, [date]),
		findPlanningRules(tenantId),
		loadWeekContext(tenantId, getMondayOfWeek(day))
	]);
	const planningRows = buildPlanningRows(dayPlanning, [date]);
	const openingHours = spanOpeningPeriods(openingPeriods);
	const timelineRange = computeTimelineRange(dayPlanning.shifts, openingHours);
	const isToday = date === toIsoDate(today);
	const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	const presentEmployeeCount = countPresentEmployees(planningRows, 0);

	return {
		view: 'day',
		...withEditedShiftValues(formActions, dayPlanning.shifts),
		...weekContext,
		issues: weekContext.issues.filter((issue) => issue.date === date).map(toIssueView),
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
		hours: listTimelineHours(timelineRange).map((hour) => ({
			label: `${hour}:00`,
			percent: toTimelinePercent(hour * 60, timelineRange)
		})),
		rows: sortPharmaciansFirst(planningRows).map(({ employee, cells }) => {
			const cell = cells[0];
			return {
				key: employee.id,
				personName: employee.fullName,
				personDetail: employee.jobTitle,
				personHours: formatDuration(sumPlannedMinutes(cell?.shifts ?? [])),
				personTag: employee.isPharmacist ? 'Ph' : undefined,
				absence: cell?.absenceKind ? { label: 'Absent', detail: cell.absenceKind } : undefined,
				bars: (cell?.shifts ?? []).map((shift) => ({
					id: shift.id,
					label: formatShiftHours(shift),
					tone: employee.isPharmacist ? 'strong' : 'soft',
					editHref: `${formActions.editShiftHrefPrefix}${shift.id}`,
					...toTimelineBarPosition(shift, timelineRange)
				}))
			};
		}),
		opening: openingHours && {
			startPercent: toTimelinePercent(toMinutesSinceMidnight(openingHours.opensAt), timelineRange),
			endPercent: toTimelinePercent(toMinutesSinceMidnight(openingHours.closesAt), timelineRange)
		},
		pharmacistCoverage:
			openingHours &&
			buildDayPharmacistCoverage(
				computePharmacistCoverage(planningRows, 0, openingPeriods, rules.minimumPharmacistsPresent),
				timelineRange
			),
		now: isToday
			? { percent: toTimelinePercent(toMinutesSinceMidnight(currentTime), timelineRange), label: currentTime }
			: undefined
	};
}

function toPlanningGridRow(
	{ employee, cells }: PlanningRow,
	weekPlanning: WeekPlanning,
	editShiftHrefPrefix: string
): PlanningGridRow {
	const employeeShifts = weekPlanning.shifts.filter((shift) => shift.employeeId === employee.id);
	return {
		key: employee.id,
		personName: employee.fullName,
		personDetail: employee.jobTitle,
		personHours: formatDuration(sumPlannedMinutes(employeeShifts)),
		personTag: employee.isPharmacist ? 'Ph' : undefined,
		cells: cells.map((cell) => ({
			key: cell.date,
			absence: cell.absenceKind ? { label: 'Absent', detail: cell.absenceKind } : undefined,
			slots: cell.shifts.map((shift) => ({
				id: shift.id,
				label: formatShiftHours(shift),
				tone: employee.isPharmacist ? 'strong' : 'soft',
				editHref: `${editShiftHrefPrefix}${shift.id}`
			}))
		}))
	};
}

const pharmacistCoverageLabel = 'Pharmacien présent';

function buildWeekPharmacistCoverage(
	planningRows: PlanningRow[],
	weekDates: string[],
	openingPeriodsByDay: OpeningHours[][],
	minimumPharmacistsPresent: number
): PlanningGridSummary {
	return {
		label: pharmacistCoverageLabel,
		cells: weekDates.map((date, dayIndex) => {
			const openingPeriods = openingPeriodsByDay[dayIndex] ?? [];
			if (openingPeriods.length === 0) return { key: date, tone: 'neutral', text: 'Fermé' };
			const gaps = listCoverageGaps(computePharmacistCoverage(planningRows, dayIndex, openingPeriods, minimumPharmacistsPresent));
			const [firstGap] = gaps;
			if (!firstGap) return { key: date, tone: 'success', text: 'Toute la journée' };
			const otherGapsCount = gaps.length - 1;
			const otherGapsText = otherGapsCount > 0 ? ` +${otherGapsCount}` : '';
			return { key: date, tone: 'danger', text: `Manque ${formatMinuteRange(firstGap)}${otherGapsText}` };
		})
	};
}

function buildDayPharmacistCoverage(
	coverageSegments: CoverageSegment[],
	timelineRange: TimelineRange
): PlanningTimelineCoverage {
	return {
		label: pharmacistCoverageLabel,
		uncoveredLabel: 'Aucun pharmacien',
		segments: coverageSegments.map((segment) => {
			const startPercent = toTimelinePercent(segment.startMinutes, timelineRange);
			return {
				key: String(segment.startMinutes),
				startPercent,
				widthPercent: toTimelinePercent(segment.endMinutes, timelineRange) - startPercent,
				isCovered: segment.isCovered,
				label: segment.isCovered ? 'Présent' : formatMinuteRange(segment)
			};
		})
	};
}

function countPresentEmployees(planningRows: PlanningRow[], dayIndex: number): number {
	return planningRows.filter((planningRow) => {
		const cell = planningRow.cells[dayIndex];
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

export const actions = {
	addShift: async ({ request, url, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const values = Object.fromEntries(
			shiftFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '')])
		) as ShiftSubmission;

		if (shiftFieldNames.some((fieldName) => values[fieldName] === '')) {
			return fail(400, {
				message: 'Renseignez l’employé, le jour, le début et la fin du créneau.',
				values
			} satisfies AddShiftFailure);
		}

		const saveResult = await addShift(tenantId, values);
		if (!saveResult.isSaved) return fail(400, { message: saveResult.message, values } satisfies AddShiftFailure);
		redirect(303, toPageHref(url, readPageQuery(url)));
	},

	updateShift: async ({ request, url, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const values = Object.fromEntries(
			shiftFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '')])
		) as ShiftSubmission;
		const shiftId = String(formData.get('shiftId') ?? '');

		if (shiftFieldNames.some((fieldName) => values[fieldName] === '')) {
			return fail(400, {
				message: 'Renseignez l’employé, le jour, le début et la fin du créneau.',
				values
			} satisfies AddShiftFailure);
		}

		const saveResult = await updateShift(tenantId, shiftId, values);
		if (!saveResult.isSaved) return fail(400, { message: saveResult.message, values } satisfies AddShiftFailure);
		redirect(303, toPageHref(url, readPageQuery(url)));
	},

	publishWeek: async ({ url, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
		await publishWeek(tenantId, readMondayOfDisplayedWeek(url));
		redirect(303, toPageHref(url, readPageQuery(url)));
	},

	returnWeekToDraft: async ({ url, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
		await returnWeekToDraft(tenantId, readMondayOfDisplayedWeek(url));
		redirect(303, toPageHref(url, readPageQuery(url)));
	},

	deleteShift: async ({ request, url, locals }) => {
		const tenantId = await requireActiveTenantId(locals.user);
		const formData = await request.formData();
		const slotId = String(formData.get('slotId') ?? '');
		if (slotId === '') return fail(400, { message: 'Créneau introuvable.' });

		await removeShift(tenantId, slotId);
		redirect(303, toPageHref(url, readPageQuery(url)));
	}
} satisfies Actions;
