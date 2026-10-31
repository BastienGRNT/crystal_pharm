import { toTimelinePercent, type TimelineRange } from '../../../domain/calendar/timeline';
import type { DayStatus } from '../../../domain/live/liveWeek';
import type { ShiftChipTone } from '../../atoms/shiftChip';

export const planningTimelineHourHeightPixels = 56;

export const dayStatusLabels: Record<DayStatus, string> = {
	ok: 'Journée couverte',
	alert: 'Il manque du monde sur cette journée',
	notice: 'Journée à regarder',
	closed: 'Pharmacie fermée',
	past: 'Journée passée'
};

export type PlanningTimelineHour = {
	label: string;
	percent: number;
};

export type PlanningTimelineBar = {
	id: string;
	label: string;
	startPercent: number;
	widthPercent: number;
	tone: ShiftChipTone;
	startTime: string;
	endTime: string;
	/** Ouvre le créneau pour le modifier. */
	editHref?: string;
};

export type PlanningTimelineRow = {
	key: string;
	employeeId: string;
	personName: string;
	personDetail: string;
	personTag?: string;
	/** Le total d'heures, aligné à droite du nom. */
	personHours?: string;
	bars: PlanningTimelineBar[];
	absence?: { label: string; detail: string };
};

/** La plage d'ouverture sur l'axe : le reste est grisé. */
export type PlanningTimelineOpening = {
	startPercent: number;
	endPercent: number;
};

/** Une heure de pointe sur l'axe, en pourcentage de la journée. */
export type PlanningTimelinePeak = {
	startPercent: number;
	endPercent: number;
};

export type PlanningTimelineNow = {
	percent: number;
	label: string;
};

export function buildDayPeaks(peakWindows: { startMinutes: number; endMinutes: number }[], timelineRange: TimelineRange): PlanningTimelinePeak[] {
	return peakWindows.map((peakWindow) => ({
		startPercent: toTimelinePercent(peakWindow.startMinutes, timelineRange),
		endPercent: toTimelinePercent(peakWindow.endMinutes, timelineRange)
	}));
}
