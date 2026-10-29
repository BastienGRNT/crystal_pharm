import { addDays, formatDayTitle, toIsoDate } from '../../../domain/calendar/week';
import { listRequirementWindowsOfDate } from '../../../domain/coverage/peakWindows';
import { generateWeek } from '../../../domain/generation/weekGenerator';
import type { GenerationEmployee } from '../../../domain/generation/generationTypes';
import { indexTermsByEmployee } from '../../../domain/rules/employeeTerms';
import { listAvailabilityRules } from '../../repositories/availabilityRuleRepository';
import { listEmployeeTerms } from '../../repositories/employeeTermsRepository';
import { listPeakWindows } from '../../repositories/peakWindowRepository';
import { findPlannedWeekStatus, savePlannedWeekStatus } from '../../repositories/plannedWeekRepository';
import { insertShift } from '../../repositories/planningRepository';
import { findPlanningRules } from '../../repositories/planningSettingsRepository';
import { getWeekPlanning, listOpeningPeriodsByDate } from '../team/teamPlanningService';

export type WeekGenerationReport = {
	addedCount: number;
	/** Une phrase par créneau posé : qui, et pourquoi lui. */
	explanations: string[];
	/** Ce que personne ne peut tenir : au titulaire de décider. */
	unfilledGaps: string[];
};

/**
 * Propose la semaine du lundi donné en comblant ce qui manque, sans toucher à l'existant.
 * Une semaine encore vide passe en brouillon : le titulaire la relit avant que l'équipe la voie.
 */
export async function generateWeekPlanning(tenantId: string, monday: Date): Promise<WeekGenerationReport> {
	const weekDates = Array.from({ length: 7 }, (_, offset) => toIsoDate(addDays(monday, offset)));
	const [weekPlanning, openingPeriodsByDate, rules, savedTerms, availabilityRules, peakWindows, status] = await Promise.all([
		getWeekPlanning(tenantId, weekDates[0] ?? '', weekDates[6] ?? ''),
		listOpeningPeriodsByDate(tenantId, weekDates),
		findPlanningRules(tenantId),
		listEmployeeTerms(tenantId),
		listAvailabilityRules(tenantId, ['approved']),
		listPeakWindows(tenantId),
		findPlannedWeekStatus(tenantId, weekDates[0] ?? '')
	]);
	const termsByEmployee = indexTermsByEmployee(
		weekPlanning.employees.map((employee) => employee.id),
		savedTerms
	);
	const employees = weekPlanning.employees.map((employee): GenerationEmployee => {
		const terms = termsByEmployee.get(employee.id);
		return {
			id: employee.id,
			fullName: employee.fullName,
			isPharmacist: employee.isPharmacist,
			isStudent: terms?.isStudent ?? false,
			weeklyContractMinutes: terms?.weeklyContractMinutes,
			hourlyRateCents: terms?.hourlyRateCents
		};
	});

	const result = generateWeek({
		weekDates,
		openingPeriodsByDate,
		requirementWindowsByDate: weekDates.map((date) => listRequirementWindowsOfDate(peakWindows, date)),
		rules,
		employees,
		absences: weekPlanning.absences,
		availabilityRules,
		existingShifts: weekPlanning.shifts
	});

	for (const { reason: _reason, ...shift } of result.proposedShifts) await insertShift(tenantId, shift);
	if (status === 'published' && weekPlanning.shifts.length === 0 && result.proposedShifts.length > 0) {
		await savePlannedWeekStatus(tenantId, weekDates[0] ?? '', 'draft');
	}

	return {
		addedCount: result.proposedShifts.length,
		explanations: result.proposedShifts.map(
			(shift) => `${formatDayTitle(new Date(`${shift.date}T00:00:00Z`))}, ${shift.startTime}–${shift.endTime} · ${shift.reason}`
		),
		unfilledGaps: result.gaps.map((gap) => `${formatDayTitle(new Date(`${gap.date}T00:00:00Z`))} : ${gap.message}`)
	};
}
