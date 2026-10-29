import { describe, expect, it } from 'vitest';
import type { Shift } from '../planning';
import { computeTimelineRange, listTimelineHours, toTimelineBarPosition, toTimelinePercent } from './timeline';

const shift = (startTime: string, endTime: string): Shift => ({
	id: `${startTime}-${endTime}`,
	employeeId: 'employee-1',
	date: '2026-10-22',
	startTime,
	endTime
});

describe('computeTimelineRange', () => {
	it('couvre 8:00–20:00 par défaut', () => {
		expect(computeTimelineRange([])).toEqual({ startMinutes: 480, endMinutes: 1200 });
		expect(computeTimelineRange([shift('08:30', '19:30')])).toEqual({ startMinutes: 480, endMinutes: 1200 });
	});

	it('s’élargit à l’heure pleine pour un créneau plus tôt ou plus tard', () => {
		expect(computeTimelineRange([shift('07:15', '20:30')])).toEqual({ startMinutes: 420, endMinutes: 1260 });
	});

	it('s’élargit aussi aux horaires d’ouverture', () => {
		expect(computeTimelineRange([], { opensAt: '07:30', closesAt: '20:15' })).toEqual({
			startMinutes: 420,
			endMinutes: 1260
		});
	});
});

describe('positions sur l’axe', () => {
	const range = { startMinutes: 480, endMinutes: 1200 };

	it('liste chaque heure pleine de l’axe', () => {
		expect(listTimelineHours(range)).toEqual([8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
	});

	it('place un créneau proportionnellement à sa durée', () => {
		expect(toTimelineBarPosition(shift('08:00', '14:00'), range)).toEqual({ startPercent: 0, widthPercent: 50 });
	});

	it('ne sort jamais de l’axe', () => {
		expect(toTimelinePercent(0, range)).toBe(0);
		expect(toTimelinePercent(24 * 60, range)).toBe(100);
	});
});
