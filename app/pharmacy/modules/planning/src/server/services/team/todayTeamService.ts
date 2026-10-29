import { formatMinuteRange, listCoverageGaps } from '../../../domain/coverage/coverage';
import { buildPlanningRows, toMinutesSinceMidnight } from '../../../domain/planning';
import { computePharmacistCoverage } from './pharmacistCoverageService';
import { getWeekPlanning, listOpeningPeriodsByDate } from './teamPlanningService';

export type TodayTeamShift = {
	id: string;
	personName: string;
	jobTitle: string;
	isPharmacist: boolean;
	startMinutes: number;
	endMinutes: number;
};

export type TodayTeamCoverageGap = {
	startMinutes: number;
	endMinutes: number;
	/** « 18:00–19:30 ». */
	label: string;
};

export type TodayTeam = {
	isOpen: boolean;
	/** Toute l'équipe, présente ou non : « 3 / 5 présents ». */
	teamSize: number;
	openingPeriods: { startMinutes: number; endMinutes: number }[];
	/** Les créneaux des présents, absents exclus. */
	shifts: TodayTeamShift[];
	/** Les heures d'ouverture sans aucun pharmacien présent. */
	pharmacistCoverageGaps: TodayTeamCoverageGap[];
	/** La journée dans le planning, relative au module : `?view=day&day=2026-10-24`. */
	dayQuery: string;
	/** Le formulaire d'un nouveau créneau, ouvert sur cette journée. */
	addShiftQuery: string;
};

/** La journée de l'équipe, telle que l'accueil la résume. */
export async function getTodayTeam(tenantId: string, isoDate: string): Promise<TodayTeam> {
	const [dayPlanning, [openingPeriods = []]] = await Promise.all([
		getWeekPlanning(tenantId, isoDate, isoDate),
		listOpeningPeriodsByDate(tenantId, [isoDate])
	]);
	const planningRows = buildPlanningRows(dayPlanning, [isoDate]);
	const coverageGaps = openingPeriods.length > 0 ? listCoverageGaps(computePharmacistCoverage(planningRows, 0, openingPeriods)) : [];

	return {
		isOpen: openingPeriods.length > 0,
		teamSize: dayPlanning.employees.length,
		openingPeriods: openingPeriods.map((openingPeriod) => ({
			startMinutes: toMinutesSinceMidnight(openingPeriod.opensAt),
			endMinutes: toMinutesSinceMidnight(openingPeriod.closesAt)
		})),
		shifts: planningRows.flatMap(({ employee, cells }) => {
			const cell = cells[0];
			if (!cell || cell.absenceKind !== undefined) return [];
			return cell.shifts.map((shift) => ({
				id: shift.id,
				personName: employee.fullName,
				jobTitle: employee.jobTitle,
				isPharmacist: employee.isPharmacist,
				startMinutes: toMinutesSinceMidnight(shift.startTime),
				endMinutes: toMinutesSinceMidnight(shift.endTime)
			}));
		}),
		pharmacistCoverageGaps: coverageGaps.map((gap) => ({
			startMinutes: gap.startMinutes,
			endMinutes: gap.endMinutes,
			label: formatMinuteRange(gap)
		})),
		dayQuery: `?view=day&day=${isoDate}`,
		addShiftQuery: `?view=day&day=${isoDate}&add=1`
	};
}
