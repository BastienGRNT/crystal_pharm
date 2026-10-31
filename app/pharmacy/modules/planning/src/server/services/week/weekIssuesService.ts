import { listWeekDays, toCalendarDay, toIsoDate } from '../../../domain/calendar/week';
import { listRequirementWindowsOfDate } from '../../../domain/coverage/peakWindows';
import type { LiveWeekInput } from '../../../domain/live/liveWeek';
import { listAvailabilityRules } from '../../repositories/availabilityRuleRepository';
import { listEmployeeTerms } from '../../repositories/employeeTermsRepository';
import { listPlannedActivities } from '../../repositories/plannedActivityRepository';
import { listPeakWindows } from '../../repositories/peakWindowRepository';
import { findPlanningRules } from '../../repositories/planningSettingsRepository';
import { getPlanningOfWeek, listOpeningPeriodsByDate } from '../team/teamPlanningService';

/** Tout ce qu'il faut pour juger la semaine du lundi donné, y compris dans le navigateur pendant un glissement. */
export async function loadLiveWeekInput(tenantId: string, monday: Date): Promise<LiveWeekInput> {
	const weekDates = listWeekDays(monday).map(toIsoDate);
	const [weekPlanning, openingPeriodsByDate, rules, terms, availabilityRules, peakWindows, plannedActivities] = await Promise.all([
		getPlanningOfWeek(tenantId, monday),
		listOpeningPeriodsByDate(tenantId, weekDates),
		findPlanningRules(tenantId),
		listEmployeeTerms(tenantId),
		listAvailabilityRules(tenantId, ['approved']),
		listPeakWindows(tenantId),
		listPlannedActivities(tenantId, weekDates[0] ?? '', weekDates.at(-1) ?? '')
	]);
	return {
		weekDates,
		firstEditableDate: toIsoDate(toCalendarDay(new Date())),
		employees: weekPlanning.employees,
		shifts: weekPlanning.shifts,
		absences: weekPlanning.absences,
		openingPeriodsByDate,
		requirementWindowsByDate: weekDates.map((date) => listRequirementWindowsOfDate(peakWindows, date)),
		rules,
		terms,
		availabilityRules,
		plannedActivities
	};
}
