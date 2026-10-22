import { fail, redirect } from '@sveltejs/kit';
import type { PlanningGridRow, PlanningTimelineRow, SegmentedControlOption } from '@crystal-pharm/ui';
import {
	buildPlanningRows,
	formatDuration,
	formatShiftHours,
	sumPlannedMinutes,
	toMinutesSinceMidnight,
	type PlanningRow,
	type WeekPlanning
} from '../domain/planning';
import { computeTimelineRange, listTimelineHours, toTimelineBarPosition, toTimelinePercent } from '../domain/timeline';
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
} from '../domain/week';
import type { Actions } from '@sveltejs/kit';
import type {
	AddShiftFailure,
	DayViewData,
	FormActions,
	PlanningPageData,
	WeekViewData
} from '../pages/teamPlanningPageData';
import { addShift, deleteShift, getWeekPlanning } from './repositories/planningRepository';

const shiftFieldNames = ['employeeId', 'date', 'startTime', 'endTime'] as const;

const weekHref = (monday: Date): string => `?view=week&week=${formatWeekParameter(monday)}`;
const dayHref = (day: Date): string => `?view=day&day=${toIsoDate(day)}`;

/** La requête de la vue affichée, sans le panneau ni le nom d'une action de formulaire. */
function readPageQuery(url: URL): URLSearchParams {
	const pageQuery = new URLSearchParams(url.searchParams);
	for (const key of [...pageQuery.keys()]) {
		if (key === 'add' || key.startsWith('/')) pageQuery.delete(key);
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

	return {
		addShiftPanel: {
			isOpen: url.searchParams.get('add') === '1',
			openHref: toPageHref(url, pageQueryWithPanel),
			closeHref: toPageHref(url, pageQuery)
		},
		// Un ajout refusé garde le panneau ouvert avec son message ; un envoi réussi revient à la vue affichée.
		addShiftFormAction: toActionHref(pageQueryWithPanel, 'addShift'),
		deleteShiftFormAction: toActionHref(pageQuery, 'deleteShift')
	};
}

export async function load({ url }: { url: URL }): Promise<PlanningPageData> {
	const now = new Date();
	const today = toCalendarDay(now);
	const formActions = buildFormActions(url);

	// La journée est la vue par défaut ; un ancien lien `?week=` sans `view` ouvre encore la semaine.
	const isWeekView =
		url.searchParams.get('view') === 'week' || (!url.searchParams.has('view') && url.searchParams.has('week'));

	if (isWeekView) {
		const monday = parseWeekParameter(url.searchParams.get('week'), today);
		return { ...(await loadWeekView(monday, today)), ...formActions };
	}

	const day = parseDayParameter(url.searchParams.get('day'), today);
	return { ...(await loadDayView(day, today, now)), ...formActions };
}

function buildViewOptions(currentView: 'week' | 'day', monday: Date, dayInWeek: Date): SegmentedControlOption[] {
	return [
		{ label: 'Journée', href: dayHref(dayInWeek), icon: 'clock', isCurrent: currentView === 'day' },
		{ label: 'Semaine', href: weekHref(monday), icon: 'calendar-dots', isCurrent: currentView === 'week' }
	];
}

async function loadWeekView(
	monday: Date,
	today: Date
): Promise<Omit<WeekViewData, keyof FormActions>> {
	const weekDays = listWeekDays(monday);
	const weekDates = weekDays.map(toIsoDate);
	const weekPlanning = await getWeekPlanning(weekDates[0] ?? '', weekDates[6] ?? '');
	const planningRows = buildPlanningRows(weekPlanning, weekDates);
	const todayIsInWeek = weekDates.includes(toIsoDate(today));

	return {
		view: 'week',
		viewOptions: buildViewOptions('week', monday, todayIsInWeek ? today : monday),
		periodNavigation: {
			label: formatWeekLabel(monday),
			previousHref: weekHref(addDays(monday, -7)),
			nextHref: weekHref(addDays(monday, 7)),
			navigationLabel: 'Semaine affichée',
			previousLabel: 'Semaine précédente',
			nextLabel: 'Semaine suivante'
		},
		context: `${formatWeekRange(monday)} · ${formatDuration(sumPlannedMinutes(weekPlanning.shifts))} planifiées`,
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
		rows: planningRows.map((planningRow) => toPlanningGridRow(planningRow, weekPlanning))
	};
}

async function loadDayView(
	day: Date,
	today: Date,
	now: Date
): Promise<Omit<DayViewData, keyof FormActions>> {
	const date = toIsoDate(day);
	const dayPlanning = await getWeekPlanning(date, date);
	const planningRows = buildPlanningRows(dayPlanning, [date]);
	const timelineRange = computeTimelineRange(dayPlanning.shifts);
	const isToday = date === toIsoDate(today);
	const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
	const presentEmployeeCount = countPresentEmployees(planningRows, 0);

	return {
		view: 'day',
		viewOptions: buildViewOptions('day', getMondayOfWeek(day), day),
		periodNavigation: {
			label: `${formatDayName(day)} ${day.getUTCDate()}`,
			previousHref: dayHref(addDays(day, -1)),
			nextHref: dayHref(addDays(day, 1)),
			navigationLabel: 'Journée affichée',
			previousLabel: 'Jour précédent',
			nextLabel: 'Jour suivant'
		},
		context: `${formatDayTitle(day)} · ${formatStaffCount(presentEmployeeCount)} · ${formatDuration(sumPlannedMinutes(dayPlanning.shifts))} planifiées`,
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
				personDetail: `${employee.jobTitle} · ${formatDuration(sumPlannedMinutes(cell?.shifts ?? []))}`,
				personTag: employee.isPharmacist ? 'Ph' : undefined,
				absence: cell?.absenceKind ? { label: 'Absent', detail: cell.absenceKind } : undefined,
				bars: (cell?.shifts ?? []).map((shift) => ({
					id: shift.id,
					label: formatShiftHours(shift),
					...toTimelineBarPosition(shift, timelineRange)
				}))
			};
		}),
		nowPercent: isToday ? toTimelinePercent(toMinutesSinceMidnight(currentTime), timelineRange) : undefined,
		nowLabel: isToday ? `Il est ${currentTime}.` : undefined
	};
}

function toPlanningGridRow({ employee, cells }: PlanningRow, weekPlanning: WeekPlanning): PlanningGridRow {
	const employeeShifts = weekPlanning.shifts.filter((shift) => shift.employeeId === employee.id);
	return {
		key: employee.id,
		personName: employee.fullName,
		personDetail: `${employee.jobTitle} · ${formatDuration(sumPlannedMinutes(employeeShifts))}`,
		personTag: employee.isPharmacist ? 'Ph' : undefined,
		cells: cells.map((cell) => ({
			key: cell.date,
			absence: cell.absenceKind ? { label: 'Absent', detail: cell.absenceKind } : undefined,
			slots: cell.shifts.map((shift) => ({ id: shift.id, label: formatShiftHours(shift) }))
		}))
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
	addShift: async ({ request, url }) => {
		const formData = await request.formData();
		const values = Object.fromEntries(
			shiftFieldNames.map((fieldName) => [fieldName, String(formData.get(fieldName) ?? '')])
		) as Record<(typeof shiftFieldNames)[number], string>;

		if (shiftFieldNames.some((fieldName) => values[fieldName] === '')) {
			return fail(400, {
				message: 'Renseignez l’employé, le jour, le début et la fin du créneau.',
				values
			} satisfies AddShiftFailure);
		}

		await addShift(values);
		redirect(303, toPageHref(url, readPageQuery(url)));
	},

	deleteShift: async ({ request, url }) => {
		const formData = await request.formData();
		const slotId = String(formData.get('slotId') ?? '');
		if (slotId === '') return fail(400, { message: 'Créneau introuvable.' });

		await deleteShift(slotId);
		redirect(303, toPageHref(url, readPageQuery(url)));
	}
} satisfies Actions;
