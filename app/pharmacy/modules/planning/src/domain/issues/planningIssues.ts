import {
	describePlannedActivity,
	findActivityDuringRange,
	sumTrainingMinutes,
	type PlannedActivity
} from '../activities/plannedActivities';
import { findBlockingRule, describeAvailabilityRule, type AvailabilityRule } from '../availability/availabilityRules';
import { formatTimeOfDay, type OpeningHours } from '../coverage/coverage';
import {
	buildPlanningRows,
	findAbsenceOfDay,
	formatDuration,
	sumPlannedMinutes,
	toMinutesSinceMidnight,
	type Shift,
	type WeekPlanning
} from '../planning';
import type { EmployeeTerms } from '../rules/employeeTerms';
import type { PlanningRules } from '../rules/planningRules';
import { computeStaffing, listInsufficientSegments, type RequirementWindow } from '../coverage/staffing';
import { formatDayTitle } from '../calendar/week';

/** `alert` : le planning ne tient pas (personne au comptoir) ; `notice` : à regarder (un contrat pas atteint). */
export type PlanningIssueSeverity = 'alert' | 'notice';

export type PlanningIssueKind =
	| 'not-enough-pharmacists'
	| 'not-enough-people'
	| 'shift-too-short'
	| 'too-many-shifts'
	| 'employee-on-absence'
	| 'shift-on-unavailability'
	| 'shift-on-activity'
	| 'activity-on-absence'
	| 'on-call-without-pharmacist'
	| 'contract-hours-short';

export type PlanningIssue = {
	key: string;
	kind: PlanningIssueKind;
	severity: PlanningIssueSeverity;
	date: string;
	employeeId: string | undefined;
	message: string;
};

export type PlanningIssueInput = {
	weekPlanning: WeekPlanning;
	/** Les sept jours de la semaine, du lundi au dimanche. */
	weekDates: string[];
	openingPeriodsByDate: OpeningHours[][];
	requirementWindowsByDate: RequirementWindow[][];
	rules: PlanningRules;
	termsByEmployee: Map<string, EmployeeTerms>;
	availabilityRules: readonly AvailabilityRule[];
	plannedActivities: readonly PlannedActivity[];
};

/** Tout ce que le titulaire doit regarder dans la semaine, du plus grave au moins grave, jour par jour. */
export function detectPlanningIssues(input: PlanningIssueInput): PlanningIssue[] {
	const issues = [
		...input.weekDates.flatMap((date, dayIndex) => detectStaffingIssues(input, date, dayIndex)),
		...detectShiftIssues(input),
		...detectActivityIssues(input),
		...detectContractIssues(input)
	];
	const severityOrder: Record<PlanningIssueSeverity, number> = { alert: 0, notice: 1 };
	return issues.sort(
		(first, second) => severityOrder[first.severity] - severityOrder[second.severity] || first.date.localeCompare(second.date)
	);
}

function detectStaffingIssues(input: PlanningIssueInput, date: string, dayIndex: number): PlanningIssue[] {
	const openingPeriods = input.openingPeriodsByDate[dayIndex] ?? [];
	if (openingPeriods.length === 0) return [];

	const planningRows = buildPlanningRows(input.weekPlanning, input.weekDates);
	const presentRows = planningRows.filter((row) => row.cells[dayIndex]?.absenceKind === undefined);
	const presentShifts = (rows: typeof planningRows): Shift[] => rows.flatMap((row) => row.cells[dayIndex]?.shifts ?? []);
	const openingIntervals = openingPeriods.map(toOpeningInterval);
	const dayTitle = formatDayTitle(new Date(`${date}T00:00:00Z`));

	const pharmacistSegments = computeStaffing(
		openingIntervals,
		presentShifts(presentRows.filter((row) => row.employee.isPharmacist)).map(toShiftInterval),
		[],
		input.rules.minimumPharmacistsPresent
	);
	const peopleSegments = computeStaffing(
		openingIntervals,
		presentShifts(presentRows).map(toShiftInterval),
		input.requirementWindowsByDate[dayIndex] ?? [],
		input.rules.minimumPeoplePresent
	);

	return [
		...listInsufficientSegments(pharmacistSegments).map((segment): PlanningIssue => ({
			key: `pharmacists-${date}-${segment.startMinutes}`,
			kind: 'not-enough-pharmacists',
			severity: 'alert',
			date,
			employeeId: undefined,
			message: `${dayTitle}, ${formatMinuteSpan(segment)} : ${segment.presentCount} pharmacien${segment.presentCount > 1 ? 's' : ''} sur ${segment.requiredCount}.`
		})),
		...listInsufficientSegments(peopleSegments).map((segment): PlanningIssue => ({
			key: `people-${date}-${segment.startMinutes}`,
			kind: 'not-enough-people',
			severity: 'alert',
			date,
			employeeId: undefined,
			message: `${dayTitle}, ${formatMinuteSpan(segment)} : ${segment.presentCount} personne${segment.presentCount > 1 ? 's' : ''} sur ${segment.requiredCount}.`
		}))
	];
}

function detectShiftIssues({ weekPlanning, weekDates, rules, availabilityRules, plannedActivities }: PlanningIssueInput): PlanningIssue[] {
	return buildPlanningRows(weekPlanning, weekDates).flatMap(({ employee, cells }) =>
		cells.flatMap((cell): PlanningIssue[] => {
			const dayTitle = formatDayTitle(new Date(`${cell.date}T00:00:00Z`));
			const issues: PlanningIssue[] = [];
			if (cell.absenceKind !== undefined && cell.shifts.length > 0) {
				issues.push({
					key: `absence-${employee.id}-${cell.date}`,
					kind: 'employee-on-absence',
					severity: 'alert',
					date: cell.date,
					employeeId: employee.id,
					message: `${employee.fullName} est prévu(e) ${dayTitle.toLocaleLowerCase('fr')} alors qu’il ou elle est absent(e) (${cell.absenceKind}).`
				});
			}
			if (cell.shifts.length > rules.maximumShiftsPerDay) {
				issues.push({
					key: `shifts-${employee.id}-${cell.date}`,
					kind: 'too-many-shifts',
					severity: 'notice',
					date: cell.date,
					employeeId: employee.id,
					message: `${employee.fullName} a ${cell.shifts.length} plages ${dayTitle.toLocaleLowerCase('fr')} (maximum ${rules.maximumShiftsPerDay}).`
				});
			}
			for (const shift of cell.shifts) {
				const blockingRule = findBlockingRule(availabilityRules, employee.id, cell.date, shift.startTime, shift.endTime);
				if (blockingRule) {
					issues.push({
						key: `unavailable-${shift.id}`,
						kind: 'shift-on-unavailability',
						severity: 'alert',
						date: cell.date,
						employeeId: employee.id,
						message: `${employee.fullName}, ${dayTitle.toLocaleLowerCase('fr')} : plage de ${shift.startTime} à ${shift.endTime} sur une indisponibilité (${describeAvailabilityRule(blockingRule).toLocaleLowerCase('fr')}).`
					});
				}
				const overlappingActivity = findActivityDuringRange(plannedActivities, employee.id, cell.date, shift.startTime, shift.endTime);
				if (overlappingActivity) {
					issues.push({
						key: `activity-${shift.id}`,
						kind: 'shift-on-activity',
						severity: 'alert',
						date: cell.date,
						employeeId: employee.id,
						message: `${employee.fullName}, ${dayTitle.toLocaleLowerCase('fr')} : plage de ${shift.startTime} à ${shift.endTime} pendant sa ${describePlannedActivity(overlappingActivity).toLocaleLowerCase('fr')}.`
					});
				}
				const durationMinutes = sumPlannedMinutes([shift]);
				if (durationMinutes >= rules.minimumShiftMinutes) continue;
				issues.push({
					key: `short-${shift.id}`,
					kind: 'shift-too-short',
					severity: 'notice',
					date: cell.date,
					employeeId: employee.id,
					message: `${employee.fullName}, ${dayTitle.toLocaleLowerCase('fr')} : plage de ${formatDuration(durationMinutes)} (minimum ${formatDuration(rules.minimumShiftMinutes)}).`
				});
			}
			return issues;
		})
	);
}

/** Une formation ou une astreinte un jour d'absence ; une astreinte que seul un pharmacien peut tenir. */
function detectActivityIssues({ weekPlanning, weekDates, plannedActivities }: PlanningIssueInput): PlanningIssue[] {
	return plannedActivities
		.filter((activity) => weekDates.includes(activity.date))
		.flatMap((activity): PlanningIssue[] => {
			const employee = weekPlanning.employees.find((candidate) => candidate.id === activity.employeeId);
			if (!employee) return [];
			const dayTitle = formatDayTitle(new Date(`${activity.date}T00:00:00Z`)).toLocaleLowerCase('fr');
			const description = describePlannedActivity(activity).toLocaleLowerCase('fr');
			const absence = findAbsenceOfDay(weekPlanning.absences, employee.id, activity.date);
			const issues: PlanningIssue[] = [];
			if (absence) {
				issues.push({
					key: `activity-absence-${activity.id}`,
					kind: 'activity-on-absence',
					severity: 'alert',
					date: activity.date,
					employeeId: employee.id,
					message: `${employee.fullName}, ${dayTitle} : ${description} alors qu’il ou elle est absent(e) (${absence.kind}).`
				});
			}
			if (activity.kind === 'on-call' && !employee.isPharmacist) {
				issues.push({
					key: `on-call-pharmacist-${activity.id}`,
					kind: 'on-call-without-pharmacist',
					severity: 'alert',
					date: activity.date,
					employeeId: employee.id,
					message: `${employee.fullName}, ${dayTitle} : une astreinte doit être tenue par un pharmacien.`
				});
			}
			return issues;
		});
}

function detectContractIssues({ weekPlanning, termsByEmployee, weekDates, plannedActivities }: PlanningIssueInput): PlanningIssue[] {
	return weekPlanning.employees.flatMap((employee): PlanningIssue[] => {
		const contractMinutes = termsByEmployee.get(employee.id)?.weeklyContractMinutes;
		if (contractMinutes === undefined) return [];
		const plannedMinutes =
			sumPlannedMinutes(weekPlanning.shifts.filter((shift) => shift.employeeId === employee.id)) +
			sumTrainingMinutes(
				plannedActivities.filter((activity) => weekDates.includes(activity.date)),
				employee.id
			);
		if (plannedMinutes >= contractMinutes) return [];
		return [
			{
				key: `contract-${employee.id}`,
				kind: 'contract-hours-short',
				severity: 'notice',
				date: weekDates[0] ?? '',
				employeeId: employee.id,
				message: `${employee.fullName} : ${formatDuration(plannedMinutes)} planifiées sur ${formatDuration(contractMinutes)} au contrat.`
			}
		];
	});
}

function toOpeningInterval(openingPeriod: OpeningHours) {
	return {
		startMinutes: toMinutesSinceMidnight(openingPeriod.opensAt),
		endMinutes: toMinutesSinceMidnight(openingPeriod.closesAt)
	};
}

function toShiftInterval(shift: Shift) {
	return { startMinutes: toMinutesSinceMidnight(shift.startTime), endMinutes: toMinutesSinceMidnight(shift.endTime) };
}

function formatMinuteSpan(span: { startMinutes: number; endMinutes: number }): string {
	return `de ${formatTimeOfDay(span.startMinutes)} à ${formatTimeOfDay(span.endMinutes)}`;
}
