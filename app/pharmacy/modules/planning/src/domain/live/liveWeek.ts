import type { AvailabilityRule } from '../availability/availabilityRules';
import { type CoverageSegment, type OpeningHours } from '../coverage/coverage';
import { computePharmacistCoverage } from '../coverage/pharmacistCoverage';
import type { RequirementWindow } from '../coverage/staffing';
import { detectPlanningIssues, type PlanningIssue } from '../issues/planningIssues';
import { buildPlanningRows, sumPlannedMinutes, type Absence, type Employee, type PlanningRow, type Shift } from '../planning';
import { indexTermsByEmployee, type EmployeeTerms } from '../rules/employeeTerms';
import type { PlanningRules } from '../rules/planningRules';

/** Tout ce qu'il faut pour juger une semaine dans le navigateur, pendant qu'on déplace un créneau. */
export type LiveWeekInput = {
	/** Les sept jours, du lundi au dimanche. */
	weekDates: string[];
	/** Les jours avant celui-ci sont passés : ils ne comptent plus dans les alertes. */
	firstEditableDate: string;
	employees: Employee[];
	shifts: Shift[];
	absences: Absence[];
	openingPeriodsByDate: OpeningHours[][];
	requirementWindowsByDate: RequirementWindow[][];
	rules: PlanningRules;
	terms: EmployeeTerms[];
	availabilityRules: AvailabilityRule[];
};

/** Un créneau déplacé, étiré ou tracé, pas encore enregistré. */
export type ShiftPreview = {
	/** Absent pour un créneau qu'on est en train de tracer. */
	shiftId?: string;
	employeeId: string;
	date: string;
	startTime: string;
	endTime: string;
};

export type DayStatus = 'ok' | 'alert' | 'notice' | 'closed' | 'past';

export type DayAssessment = {
	date: string;
	status: DayStatus;
	pharmacistCoverage: CoverageSegment[];
};

/** `short` : sous son contrat ; `over` : trop d'heures (au-delà du contrat ou de la limite légale). */
export type EmployeeHoursStatus = 'ok' | 'short' | 'over';

export type EmployeeAssessment = {
	employeeId: string;
	plannedMinutes: number;
	contractMinutes: number | undefined;
	status: EmployeeHoursStatus;
};

export type WeekAssessment = {
	issues: PlanningIssue[];
	days: DayAssessment[];
	employees: EmployeeAssessment[];
	planningRows: PlanningRow[];
	shifts: Shift[];
};

export const overContractToleranceMinutes = 60;
export const weeklyLegalLimitMinutes = 48 * 60;
const previewShiftId = 'preview';

export function applyShiftPreview(shifts: Shift[], preview: ShiftPreview | undefined): Shift[] {
	if (!preview) return shifts;
	const { shiftId, ...fields } = preview;
	const previewed: Shift = { id: shiftId ?? previewShiftId, ...fields };
	return shiftId ? shifts.map((shift) => (shift.id === shiftId ? previewed : shift)) : [...shifts, previewed];
}

export function assessWeek(input: LiveWeekInput, preview?: ShiftPreview): WeekAssessment {
	const shifts = applyShiftPreview(input.shifts, preview);
	const weekPlanning = { employees: input.employees, shifts, absences: input.absences };
	const termsByEmployee = indexTermsByEmployee(
		input.employees.map((employee) => employee.id),
		input.terms
	);
	const issues = detectPlanningIssues({
		weekPlanning,
		weekDates: input.weekDates,
		openingPeriodsByDate: input.openingPeriodsByDate,
		requirementWindowsByDate: input.requirementWindowsByDate,
		rules: input.rules,
		termsByEmployee,
		availabilityRules: input.availabilityRules
	}).filter((issue) => issue.kind === 'contract-hours-short' || issue.date >= input.firstEditableDate);

	const planningRows = buildPlanningRows(weekPlanning, input.weekDates);
	return {
		issues,
		planningRows,
		shifts,
		days: input.weekDates.map((date, dayIndex) => assessDay(input, planningRows, issues, date, dayIndex)),
		employees: input.employees.map((employee) => {
			const contractMinutes = termsByEmployee.get(employee.id)?.weeklyContractMinutes;
			const plannedMinutes = sumPlannedMinutes(shifts.filter((shift) => shift.employeeId === employee.id));
			return { employeeId: employee.id, plannedMinutes, contractMinutes, status: judgeEmployeeHours(plannedMinutes, contractMinutes) };
		})
	};
}

function judgeEmployeeHours(plannedMinutes: number, contractMinutes: number | undefined): EmployeeHoursStatus {
	if (plannedMinutes > weeklyLegalLimitMinutes) return 'over';
	if (contractMinutes === undefined) return 'ok';
	if (plannedMinutes < contractMinutes) return 'short';
	return plannedMinutes > contractMinutes + overContractToleranceMinutes ? 'over' : 'ok';
}

function assessDay(input: LiveWeekInput, planningRows: PlanningRow[], issues: PlanningIssue[], date: string, dayIndex: number): DayAssessment {
	const openingPeriods = input.openingPeriodsByDate[dayIndex] ?? [];
	const pharmacistCoverage =
		openingPeriods.length === 0 ? [] : computePharmacistCoverage(planningRows, dayIndex, openingPeriods, input.rules.minimumPharmacistsPresent);
	return { date, status: judgeDay(input, issues, date, openingPeriods), pharmacistCoverage };
}

function judgeDay(input: LiveWeekInput, issues: PlanningIssue[], date: string, openingPeriods: OpeningHours[]): DayStatus {
	if (openingPeriods.length === 0) return 'closed';
	if (date < input.firstEditableDate) return 'past';
	const dayIssues = issues.filter((issue) => issue.date === date && issue.kind !== 'contract-hours-short');
	if (dayIssues.some((issue) => issue.severity === 'alert')) return 'alert';
	return dayIssues.length > 0 ? 'notice' : 'ok';
}
