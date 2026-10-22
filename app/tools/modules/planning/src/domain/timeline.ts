import { toMinutesSinceMidnight, type Shift } from './planning';

export type TimelineRange = {
	startMinutes: number;
	endMinutes: number;
};

export type TimelineBarPosition = {
	startPercent: number;
	widthPercent: number;
};

const minutesPerHour = 60;
const defaultTimelineRange: TimelineRange = { startMinutes: 8 * minutesPerHour, endMinutes: 20 * minutesPerHour };

/** De 8:00 à 20:00, élargi à l'heure pleine si un créneau commence plus tôt ou finit plus tard. */
export function computeTimelineRange(shifts: Shift[]): TimelineRange {
	const shiftStarts = shifts.map((shift) => toMinutesSinceMidnight(shift.startTime));
	const shiftEnds = shifts.map((shift) => toMinutesSinceMidnight(shift.endTime));
	const earliestStart = Math.min(defaultTimelineRange.startMinutes, ...shiftStarts);
	const latestEnd = Math.max(defaultTimelineRange.endMinutes, ...shiftEnds);
	return {
		startMinutes: Math.floor(earliestStart / minutesPerHour) * minutesPerHour,
		endMinutes: Math.ceil(latestEnd / minutesPerHour) * minutesPerHour
	};
}

export function listTimelineHours(range: TimelineRange): number[] {
	const firstHour = range.startMinutes / minutesPerHour;
	const lastHour = range.endMinutes / minutesPerHour;
	return Array.from({ length: lastHour - firstHour + 1 }, (_, hourIndex) => firstHour + hourIndex);
}

export function toTimelinePercent(minutesSinceMidnight: number, range: TimelineRange): number {
	const rangeLength = range.endMinutes - range.startMinutes;
	const percent = ((minutesSinceMidnight - range.startMinutes) / rangeLength) * 100;
	return Math.min(100, Math.max(0, percent));
}

export function toTimelineBarPosition(shift: Shift, range: TimelineRange): TimelineBarPosition {
	const startPercent = toTimelinePercent(toMinutesSinceMidnight(shift.startTime), range);
	const endPercent = toTimelinePercent(toMinutesSinceMidnight(shift.endTime), range);
	return { startPercent, widthPercent: endPercent - startPercent };
}
