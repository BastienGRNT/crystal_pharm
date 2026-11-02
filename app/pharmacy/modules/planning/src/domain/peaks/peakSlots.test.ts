import { describe, expect, it } from 'vitest';
import {
	adjustRequiredCountOfSlots,
	copyPeakSlots,
	describeOpeningOfPeakSlots,
	listPeakDaysOfWeek,
	listPeakSlotsOfDay,
	resetPeakSlots,
	toPeakWindowsOfDay,
	toPeakWindowsOfWeek,
	type PeakSlot
} from './peakSlots';

const morningAndAfternoon = [
	{ opensAt: '09:00', closesAt: '12:30' },
	{ opensAt: '14:00', closesAt: '15:15' }
];
const baseRequiredCount = 2;

function slotsOfDay(peakWindows: { startTime: string; endTime: string; requiredCount: number }[] = []): PeakSlot[] {
	return listPeakSlotsOfDay(morningAndAfternoon, peakWindows, baseRequiredCount);
}

describe('listPeakSlotsOfDay', () => {
	it('cuts the day in half hours, keeping the lunch break closed and an odd closing time', () => {
		const slots = slotsOfDay();

		expect(slots.map((slot) => slot.startMinutes / 60)).toEqual([9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15]);
		expect(slots.filter((slot) => !slot.isOpen).map((slot) => slot.startMinutes / 60)).toEqual([12.5, 13, 13.5]);
		expect(slots.at(-1)).toEqual({ startMinutes: 15 * 60, endMinutes: 15 * 60 + 15, isOpen: true, requiredCount: baseRequiredCount });
	});

	it('raises the slots covered by a peak window, never below the permanent staff', () => {
		const slots = slotsOfDay([
			{ startTime: '10:00', endTime: '11:00', requiredCount: 4 },
			{ startTime: '11:00', endTime: '11:30', requiredCount: 1 }
		]);

		expect(slots.map((slot) => slot.requiredCount).slice(0, 6)).toEqual([2, 2, 4, 4, 2, 2]);
	});

	it('ignores a peak window during the lunch break', () => {
		const slots = slotsOfDay([{ startTime: '12:30', endTime: '14:00', requiredCount: 5 }]);

		expect(slots.every((slot) => slot.requiredCount === baseRequiredCount)).toBe(true);
	});

	it('has no slot on a closed day', () => {
		expect(listPeakSlotsOfDay([], [], baseRequiredCount)).toEqual([]);
	});
});

describe('adjustRequiredCountOfSlots', () => {
	it('adds people to the chosen open slots only, between the permanent staff and the ceiling', () => {
		const slots = adjustRequiredCountOfSlots(slotsOfDay(), 6, 10, 1, baseRequiredCount);

		expect(slots.map((slot) => slot.requiredCount).slice(5, 12)).toEqual([2, 3, 2, 2, 2, 3, 2]);
		expect(adjustRequiredCountOfSlots(slots, 6, 6, -5, baseRequiredCount)[6]?.requiredCount).toBe(baseRequiredCount);
		expect(adjustRequiredCountOfSlots(slots, 6, 6, 100, baseRequiredCount)[6]?.requiredCount).toBe(30);
	});
});

describe('toPeakWindowsOfDay', () => {
	it('merges neighbouring slots with the same staff into one peak window', () => {
		const slots = slotsOfDay([
			{ startTime: '10:00', endTime: '10:30', requiredCount: 4 },
			{ startTime: '10:30', endTime: '11:30', requiredCount: 4 },
			{ startTime: '11:30', endTime: '12:30', requiredCount: 3 }
		]);

		expect(toPeakWindowsOfDay(5, slots, baseRequiredCount)).toEqual([
			{ weekday: 5, startTime: '10:00', endTime: '11:30', requiredCount: 4 },
			{ weekday: 5, startTime: '11:30', endTime: '12:30', requiredCount: 3 }
		]);
	});

	it('splits a peak window around the lunch break', () => {
		const slots = adjustRequiredCountOfSlots(slotsOfDay(), 0, 12, 1, baseRequiredCount);

		expect(toPeakWindowsOfDay(0, slots, baseRequiredCount)).toEqual([
			{ weekday: 0, startTime: '09:00', endTime: '12:30', requiredCount: 3 },
			{ weekday: 0, startTime: '14:00', endTime: '15:15', requiredCount: 3 }
		]);
	});

	it('gives nothing for a day at the permanent staff', () => {
		expect(toPeakWindowsOfDay(0, resetPeakSlots(adjustRequiredCountOfSlots(slotsOfDay(), 0, 3, 2, 2), 2), 2)).toEqual([]);
	});
});

describe('copyPeakSlots', () => {
	it('copies the staff hour by hour, within the opening hours of the target day', () => {
		const source = listPeakSlotsOfDay([{ opensAt: '08:00', closesAt: '20:00' }], [{ startTime: '17:00', endTime: '20:00', requiredCount: 5 }], 2);
		const target = listPeakSlotsOfDay([{ opensAt: '09:00', closesAt: '18:00' }], [{ startTime: '09:00', endTime: '10:00', requiredCount: 4 }], 2);

		expect(toPeakWindowsOfDay(1, copyPeakSlots(source, target, 2), 2)).toEqual([
			{ weekday: 1, startTime: '17:00', endTime: '18:00', requiredCount: 5 }
		]);
	});
});

describe('listPeakDaysOfWeek', () => {
	it('reads the peak windows back from the week, from Monday to Sunday', () => {
		const peakWindows = [{ id: 'a', weekday: 5, startTime: '10:00', endTime: '12:00', requiredCount: 4 }];
		const days = listPeakDaysOfWeek(
			{ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: morningAndAfternoon, sunday: [] },
			peakWindows,
			baseRequiredCount
		);

		expect(days.map((day) => day.slots.length)).toEqual([0, 0, 0, 0, 0, 13, 0]);
		expect(toPeakWindowsOfWeek(days, baseRequiredCount)).toEqual([{ weekday: 5, startTime: '10:00', endTime: '12:00', requiredCount: 4 }]);
	});
});

describe('describeOpeningOfPeakSlots', () => {
	it('gives back the opening hours around the lunch break', () => {
		expect(describeOpeningOfPeakSlots(slotsOfDay())).toBe('09:00–12:30 · 14:00–15:15');
	});
});
