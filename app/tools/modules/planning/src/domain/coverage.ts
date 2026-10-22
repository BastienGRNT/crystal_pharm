import { toMinutesSinceMidnight, type Shift } from './planning';

export type OpeningHours = {
	opensAt: string;
	closesAt: string;
};

export type CoverageSegment = {
	startMinutes: number;
	endMinutes: number;
	isCovered: boolean;
};

type MinuteInterval = {
	startMinutes: number;
	endMinutes: number;
};

/**
 * Découpe les horaires d'ouverture en segments couverts ou non par les créneaux donnés
 * (ceux des pharmaciens présents, pour la règle « un pharmacien en permanence »).
 */
export function computeCoverage(openingHours: OpeningHours, presentShifts: Shift[]): CoverageSegment[] {
	const opening = {
		startMinutes: toMinutesSinceMidnight(openingHours.opensAt),
		endMinutes: toMinutesSinceMidnight(openingHours.closesAt)
	};
	const coveredIntervals = mergeOverlappingIntervals(
		presentShifts
			.map((shift) => clipToOpening(shift, opening))
			.filter((interval): interval is MinuteInterval => interval !== undefined)
	);
	return fillGapsBetween(coveredIntervals, opening);
}

export function listCoverageGaps(segments: CoverageSegment[]): CoverageSegment[] {
	return segments.filter((segment) => !segment.isCovered);
}

/** « 18:00–19:30 ». */
export function formatMinuteRange(segment: CoverageSegment): string {
	return `${formatTimeOfDay(segment.startMinutes)}–${formatTimeOfDay(segment.endMinutes)}`;
}

function formatTimeOfDay(minutesSinceMidnight: number): string {
	const hours = Math.floor(minutesSinceMidnight / 60);
	const minutes = minutesSinceMidnight % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function clipToOpening(shift: Shift, opening: MinuteInterval): MinuteInterval | undefined {
	const startMinutes = Math.max(opening.startMinutes, toMinutesSinceMidnight(shift.startTime));
	const endMinutes = Math.min(opening.endMinutes, toMinutesSinceMidnight(shift.endTime));
	return startMinutes < endMinutes ? { startMinutes, endMinutes } : undefined;
}

function mergeOverlappingIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
	const sortedIntervals = [...intervals].sort((first, second) => first.startMinutes - second.startMinutes);
	return sortedIntervals.reduce<MinuteInterval[]>((mergedIntervals, interval) => {
		const lastInterval = mergedIntervals.at(-1);
		if (lastInterval && interval.startMinutes <= lastInterval.endMinutes) {
			lastInterval.endMinutes = Math.max(lastInterval.endMinutes, interval.endMinutes);
		} else {
			mergedIntervals.push({ ...interval });
		}
		return mergedIntervals;
	}, []);
}

function fillGapsBetween(coveredIntervals: MinuteInterval[], opening: MinuteInterval): CoverageSegment[] {
	const segments: CoverageSegment[] = [];
	let cursorMinutes = opening.startMinutes;
	for (const interval of coveredIntervals) {
		if (cursorMinutes < interval.startMinutes) {
			segments.push({ startMinutes: cursorMinutes, endMinutes: interval.startMinutes, isCovered: false });
		}
		segments.push({ ...interval, isCovered: true });
		cursorMinutes = interval.endMinutes;
	}
	if (cursorMinutes < opening.endMinutes) {
		segments.push({ startMinutes: cursorMinutes, endMinutes: opening.endMinutes, isCovered: false });
	}
	return segments;
}
