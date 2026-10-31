import type { LiveWeekInput } from '../live/liveWeek';
import { indexTermsByEmployee } from '../rules/employeeTerms';
import type { GenerationEmployee, GenerationInput } from './generationTypes';

/** La semaine telle qu'enregistrée, mise en forme pour le générateur. */
export function buildGenerationInput(week: LiveWeekInput): GenerationInput {
	const termsByEmployee = indexTermsByEmployee(
		week.employees.map((employee) => employee.id),
		week.terms
	);
	const employees = week.employees.map((employee): GenerationEmployee => {
		const terms = termsByEmployee.get(employee.id);
		return {
			id: employee.id,
			fullName: employee.fullName,
			isPharmacist: employee.isPharmacist,
			isStudent: terms?.isStudent ?? false,
			isPlannedManually: terms?.isPlannedManually ?? false,
			weeklyContractMinutes: terms?.weeklyContractMinutes,
			hourlyRateCents: terms?.hourlyRateCents
		};
	});
	return {
		weekDates: week.weekDates,
		firstEditableDate: week.firstEditableDate,
		openingPeriodsByDate: week.openingPeriodsByDate,
		requirementWindowsByDate: week.requirementWindowsByDate,
		rules: week.rules,
		employees,
		absences: week.absences,
		availabilityRules: week.availabilityRules,
		existingShifts: week.shifts,
		plannedActivities: week.plannedActivities
	};
}
