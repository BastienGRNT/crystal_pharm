import { addDays, listWeekDays, toIsoDate } from '../../../domain/calendar/week';
import { detectPlanningIssues, type PlanningIssue } from '../../../domain/issues/planningIssues';
import { indexTermsByEmployee } from '../../../domain/rules/employeeTerms';
import { listEmployeeTerms } from '../../repositories/employeeTermsRepository';
import { findPlanningRules } from '../../repositories/planningSettingsRepository';
import { getWeekPlanning, listOpeningPeriodsByDate } from '../team/teamPlanningService';

/** Ce qui cloche dans la semaine du lundi donné, selon les règles de la pharmacie. */
export async function listWeekIssues(tenantId: string, monday: Date): Promise<PlanningIssue[]> {
	const weekDates = listWeekDays(monday).map(toIsoDate);
	const [weekPlanning, openingPeriodsByDate, rules, savedTerms] = await Promise.all([
		getWeekPlanning(tenantId, toIsoDate(monday), toIsoDate(addDays(monday, 6))),
		listOpeningPeriodsByDate(tenantId, weekDates),
		findPlanningRules(tenantId),
		listEmployeeTerms(tenantId)
	]);
	return detectPlanningIssues({
		weekPlanning,
		weekDates,
		openingPeriodsByDate,
		requirementWindowsByDate: weekDates.map(() => []),
		rules,
		termsByEmployee: indexTermsByEmployee(
			weekPlanning.employees.map((employee) => employee.id),
			savedTerms
		)
	});
}
