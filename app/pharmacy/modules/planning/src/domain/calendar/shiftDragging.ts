import type { TimelineRange } from './timeline';

export type MinuteSpan = { startMinutes: number; endMinutes: number };

export const dragSnapMinutes = 15;
export const minimumDraggedShiftMinutes = 30;

const minutesPerHour = 60;

export function snapToQuarterHour(minutes: number): number {
	return Math.round(minutes / dragSnapMinutes) * dragSnapMinutes;
}

/** Le créneau glisse sans changer de durée, et reste dans l'axe affiché. */
export function moveSpan(span: MinuteSpan, deltaMinutes: number, range: TimelineRange): MinuteSpan {
	const duration = span.endMinutes - span.startMinutes;
	const startMinutes = Math.min(range.endMinutes - duration, Math.max(range.startMinutes, snapToQuarterHour(span.startMinutes + deltaMinutes)));
	return { startMinutes, endMinutes: startMinutes + duration };
}

export function resizeSpan(span: MinuteSpan, edge: 'start' | 'end', deltaMinutes: number, range: TimelineRange): MinuteSpan {
	if (edge === 'start') {
		const startMinutes = Math.min(span.endMinutes - minimumDraggedShiftMinutes, Math.max(range.startMinutes, snapToQuarterHour(span.startMinutes + deltaMinutes)));
		return { startMinutes, endMinutes: span.endMinutes };
	}
	const endMinutes = Math.max(span.startMinutes + minimumDraggedShiftMinutes, Math.min(range.endMinutes, snapToQuarterHour(span.endMinutes + deltaMinutes)));
	return { startMinutes: span.startMinutes, endMinutes };
}

/** Du point où l'on a appuyé à celui où l'on est, dans un sens ou dans l'autre. */
export function spanBetween(anchorMinutes: number, currentMinutes: number, range: TimelineRange): MinuteSpan {
	const clamp = (minutes: number): number => Math.min(range.endMinutes, Math.max(range.startMinutes, snapToQuarterHour(minutes)));
	const [startMinutes, endMinutes] = [clamp(anchorMinutes), clamp(currentMinutes)].sort((first, second) => first - second);
	return { startMinutes: startMinutes ?? 0, endMinutes: endMinutes ?? 0 };
}

export function formatMinutesAsTime(minutes: number): string {
	const hours = Math.floor(minutes / minutesPerHour);
	return `${String(hours).padStart(2, '0')}:${String(minutes % minutesPerHour).padStart(2, '0')}`;
}
