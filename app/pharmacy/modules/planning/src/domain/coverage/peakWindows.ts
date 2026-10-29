import { toMinutesSinceMidnight } from '../planning';
import { getWeekdayIndexOfDate } from '../availability/availabilityRules';
import type { RequirementWindow } from './staffing';

/** Une heure de pointe qui revient chaque semaine : l'effectif demandé y monte. */
export type PeakWindow = {
	id: string;
	/** 0 = lundi. */
	weekday: number;
	startTime: string;
	endTime: string;
	requiredCount: number;
};

export function listRequirementWindowsOfDate(peakWindows: readonly PeakWindow[], isoDate: string): RequirementWindow[] {
	const weekday = getWeekdayIndexOfDate(isoDate);
	return peakWindows
		.filter((peakWindow) => peakWindow.weekday === weekday)
		.map((peakWindow) => ({
			startMinutes: toMinutesSinceMidnight(peakWindow.startTime),
			endMinutes: toMinutesSinceMidnight(peakWindow.endTime),
			requiredCount: peakWindow.requiredCount
		}));
}

const weekdayLabels = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export const describePeakWindow = (peakWindow: PeakWindow): string =>
	`${weekdayLabels[peakWindow.weekday] ?? ''}, de ${peakWindow.startTime} à ${peakWindow.endTime} : ${peakWindow.requiredCount} personnes`;
