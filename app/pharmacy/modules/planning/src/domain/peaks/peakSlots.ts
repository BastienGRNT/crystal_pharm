import { weekdays, type WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import { formatTimeOfDay, type OpeningHours } from '../coverage/coverage';
import type { PeakWindow } from '../coverage/peakWindows';
import { toMinutesSinceMidnight } from '../planning';

/** Le pas de réglage de l'affluence : assez fin pour 12:30, assez gros pour rester lisible. */
export const peakSlotLengthInMinutes = 30;
export const largestRequiredCount = 30;

export type NewPeakWindow = Omit<PeakWindow, 'id'>;

/** Un créneau de la journée et le nombre de personnes demandé ; fermé pendant la pause de midi. */
export type PeakSlot = {
	startMinutes: number;
	endMinutes: number;
	isOpen: boolean;
	requiredCount: number;
};

/** Une journée de la semaine (0 = lundi) et ses créneaux ; aucun si la pharmacie est fermée. */
export type PeakDay = {
	weekday: number;
	slots: PeakSlot[];
};

export function listPeakDaysOfWeek(
	weeklyOpeningSchedule: WeeklyOpeningSchedule | undefined,
	peakWindows: readonly PeakWindow[],
	baseRequiredCount: number
): PeakDay[] {
	return weekdays.map((weekdayName, weekday) => ({
		weekday,
		slots: listPeakSlotsOfDay(
			weeklyOpeningSchedule?.[weekdayName] ?? [],
			peakWindows.filter((peakWindow) => peakWindow.weekday === weekday),
			baseRequiredCount
		)
	}));
}

export function toPeakWindowsOfWeek(peakDays: readonly PeakDay[], baseRequiredCount: number): NewPeakWindow[] {
	return peakDays.flatMap((peakDay) => toPeakWindowsOfDay(peakDay.weekday, peakDay.slots, baseRequiredCount));
}

/**
 * Les créneaux de la première ouverture à la dernière fermeture, pause de midi comprise (fermée).
 * Une heure d'affluence en dehors des heures d'ouverture ne compte pas : le planning n'y place personne.
 */
export function listPeakSlotsOfDay(
	openingPeriods: readonly OpeningHours[],
	peakWindowsOfDay: readonly Pick<PeakWindow, 'startTime' | 'endTime' | 'requiredCount'>[],
	baseRequiredCount: number
): PeakSlot[] {
	const openingIntervals = openingPeriods.map((period) => ({
		startMinutes: toMinutesSinceMidnight(period.opensAt),
		endMinutes: toMinutesSinceMidnight(period.closesAt)
	}));
	const peakIntervals = peakWindowsOfDay.map((peakWindow) => ({
		startMinutes: toMinutesSinceMidnight(peakWindow.startTime),
		endMinutes: toMinutesSinceMidnight(peakWindow.endTime),
		requiredCount: peakWindow.requiredCount
	}));
	const breakpoints = listSlotBreakpoints(openingIntervals);
	return breakpoints.slice(0, -1).map((startMinutes, index): PeakSlot => {
		const endMinutes = breakpoints[index + 1] ?? startMinutes;
		const isOpen = openingIntervals.some((opening) => opening.startMinutes <= startMinutes && endMinutes <= opening.endMinutes);
		const peakCounts = peakIntervals
			.filter((peak) => peak.startMinutes <= startMinutes && startMinutes < peak.endMinutes)
			.map((peak) => peak.requiredCount);
		const requiredCount = isOpen ? Math.max(baseRequiredCount, ...peakCounts) : baseRequiredCount;
		return { startMinutes, endMinutes, isOpen, requiredCount: Math.min(requiredCount, largestRequiredCount) };
	});
}

// Les heures rondes et demi-heures, plus les heures d'ouverture qui tombent entre deux (« 12:15 »).
function listSlotBreakpoints(openingIntervals: { startMinutes: number; endMinutes: number }[]): number[] {
	if (openingIntervals.length === 0) return [];
	const firstMinutes = Math.min(...openingIntervals.map((opening) => opening.startMinutes));
	const lastMinutes = Math.max(...openingIntervals.map((opening) => opening.endMinutes));
	const roundBreakpoints: number[] = [];
	for (let minutes = Math.ceil(firstMinutes / peakSlotLengthInMinutes) * peakSlotLengthInMinutes; minutes < lastMinutes; minutes += peakSlotLengthInMinutes) {
		roundBreakpoints.push(minutes);
	}
	const openingBreakpoints = openingIntervals.flatMap((opening) => [opening.startMinutes, opening.endMinutes]);
	return [...new Set([firstMinutes, ...roundBreakpoints, ...openingBreakpoints, lastMinutes])].sort((first, second) => first - second);
}

/** Ajoute (ou retire) des personnes sur les créneaux ouverts choisis, sans descendre sous l'effectif permanent. */
export function adjustRequiredCountOfSlots(
	slots: readonly PeakSlot[],
	firstIndex: number,
	lastIndex: number,
	countDifference: number,
	baseRequiredCount: number
): PeakSlot[] {
	return slots.map((slot, index) => {
		if (!slot.isOpen || index < firstIndex || index > lastIndex) return slot;
		const requiredCount = Math.min(largestRequiredCount, Math.max(baseRequiredCount, slot.requiredCount + countDifference));
		return { ...slot, requiredCount };
	});
}

export function resetPeakSlots(slots: readonly PeakSlot[], baseRequiredCount: number): PeakSlot[] {
	return slots.map((slot) => ({ ...slot, requiredCount: baseRequiredCount }));
}

/** Reprend l'affluence d'un jour sur un autre, heure par heure, dans les heures d'ouverture du jour visé. */
export function copyPeakSlots(sourceSlots: readonly PeakSlot[], targetSlots: readonly PeakSlot[], baseRequiredCount: number): PeakSlot[] {
	return targetSlots.map((targetSlot) => {
		if (!targetSlot.isOpen) return targetSlot;
		const sourceSlot = sourceSlots.find(
			(slot) => slot.isOpen && slot.startMinutes <= targetSlot.startMinutes && targetSlot.startMinutes < slot.endMinutes
		);
		return { ...targetSlot, requiredCount: sourceSlot?.requiredCount ?? baseRequiredCount };
	});
}

/** Les créneaux voisins au même effectif, au-dessus de l'effectif permanent, forment une heure d'affluence. */
export function toPeakWindowsOfDay(weekday: number, slots: readonly PeakSlot[], baseRequiredCount: number): NewPeakWindow[] {
	const peakWindows: NewPeakWindow[] = [];
	let previousSlot: PeakSlot | undefined;
	for (const slot of slots) {
		const lastPeakWindow = peakWindows.at(-1);
		const continuesLastPeakWindow =
			lastPeakWindow !== undefined &&
			previousSlot?.isOpen === true &&
			previousSlot.requiredCount === slot.requiredCount &&
			lastPeakWindow.endTime === formatTimeOfDay(slot.startMinutes);
		if (slot.isOpen && slot.requiredCount > baseRequiredCount) {
			if (continuesLastPeakWindow) lastPeakWindow.endTime = formatTimeOfDay(slot.endMinutes);
			else {
				peakWindows.push({
					weekday,
					startTime: formatTimeOfDay(slot.startMinutes),
					endTime: formatTimeOfDay(slot.endMinutes),
					requiredCount: slot.requiredCount
				});
			}
		}
		previousSlot = slot;
	}
	return peakWindows;
}

/** « 09:00–12:30 · 14:00–19:30 » : les heures d'ouverture que les créneaux couvrent. */
export function describeOpeningOfPeakSlots(slots: readonly PeakSlot[]): string {
	const openRanges: { startMinutes: number; endMinutes: number }[] = [];
	for (const slot of slots.filter((openSlot) => openSlot.isOpen)) {
		const lastRange = openRanges.at(-1);
		if (lastRange?.endMinutes === slot.startMinutes) lastRange.endMinutes = slot.endMinutes;
		else openRanges.push({ startMinutes: slot.startMinutes, endMinutes: slot.endMinutes });
	}
	return openRanges.map((range) => `${formatTimeOfDay(range.startMinutes)}–${formatTimeOfDay(range.endMinutes)}`).join(' · ');
}
