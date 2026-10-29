import { weekdays, type WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { toMinutesSinceMidnight, type Shift } from '../planning';
import { computeStaffing, type MinuteInterval } from './staffing';

export type OpeningHours = {
	opensAt: string;
	closesAt: string;
};

/** Les plages d'ouverture du jour (« 2026-10-24 »), dans l'ordre ; aucune s'il est fermé ou sans horaires saisis. */
export function listOpeningPeriodsOfDate(
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined,
	isoDate: string
): OpeningHours[] {
	const daysSinceMonday = (new Date(`${isoDate}T00:00:00Z`).getUTCDay() + 6) % 7;
	const weekday = weekdays[daysSinceMonday];
	return weeklyOpeningSchedule && weekday ? weeklyOpeningSchedule[weekday] : [];
}

/** De la première ouverture à la dernière fermeture du jour, pause de midi comprise. */
export function spanOpeningPeriods(openingPeriods: OpeningHours[]): OpeningHours | undefined {
	const firstPeriod = openingPeriods[0];
	const lastPeriod = openingPeriods.at(-1);
	return firstPeriod && lastPeriod ? { opensAt: firstPeriod.opensAt, closesAt: lastPeriod.closesAt } : undefined;
}

/** La couverture de chaque plage d'ouverture, mises bout à bout : la pause de midi n'a pas à être couverte. */
export function computeCoverageOfOpeningPeriods(
	openingPeriods: OpeningHours[],
	presentShifts: Shift[],
	minimumCount = 1
): CoverageSegment[] {
	return openingPeriods.flatMap((openingPeriod) => computeCoverage(openingPeriod, presentShifts, minimumCount));
}

export type CoverageSegment = {
	startMinutes: number;
	endMinutes: number;
	isCovered: boolean;
};

/**
 * Découpe les horaires d'ouverture en segments couverts ou non par les créneaux donnés
 * (ceux des pharmaciens présents, pour la règle « un pharmacien en permanence »).
 * Un segment est couvert quand au moins `minimumCount` créneaux s'y superposent.
 */
export function computeCoverage(
	openingHours: OpeningHours,
	presentShifts: Shift[],
	minimumCount = 1
): CoverageSegment[] {
	const opening = {
		startMinutes: toMinutesSinceMidnight(openingHours.opensAt),
		endMinutes: toMinutesSinceMidnight(openingHours.closesAt)
	};
	return computeStaffing([opening], presentShifts.map(toMinuteInterval), [], minimumCount).map(
		({ startMinutes, endMinutes, isSufficient }) => ({ startMinutes, endMinutes, isCovered: isSufficient })
	);
}

export function listCoverageGaps(segments: CoverageSegment[]): CoverageSegment[] {
	return segments.filter((segment) => !segment.isCovered);
}

/** « 18:00–19:30 ». */
export function formatMinuteRange(segment: CoverageSegment): string {
	return `${formatTimeOfDay(segment.startMinutes)}–${formatTimeOfDay(segment.endMinutes)}`;
}

export function formatTimeOfDay(minutesSinceMidnight: number): string {
	const hours = Math.floor(minutesSinceMidnight / 60);
	const minutes = minutesSinceMidnight % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function toMinuteInterval(shift: Shift): MinuteInterval {
	return { startMinutes: toMinutesSinceMidnight(shift.startTime), endMinutes: toMinutesSinceMidnight(shift.endTime) };
}
