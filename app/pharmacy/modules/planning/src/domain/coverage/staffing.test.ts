import { describe, expect, it } from 'vitest';
import { computeStaffing, listInsufficientSegments } from './staffing';

const openingFrom8To20 = [{ startMinutes: 8 * 60, endMinutes: 20 * 60 }];

describe('computeStaffing', () => {
	it('réclame l’effectif de base sur toute l’ouverture', () => {
		const segments = computeStaffing(openingFrom8To20, [{ startMinutes: 8 * 60, endMinutes: 14 * 60 }], [], 1);
		expect(listInsufficientSegments(segments)).toEqual([
			{ startMinutes: 14 * 60, endMinutes: 20 * 60, presentCount: 0, requiredCount: 1, isSufficient: false }
		]);
	});

	it('compte les personnes qui se superposent', () => {
		const presentIntervals = [
			{ startMinutes: 8 * 60, endMinutes: 16 * 60 },
			{ startMinutes: 12 * 60, endMinutes: 20 * 60 }
		];
		const segments = computeStaffing(openingFrom8To20, presentIntervals, [], 2);
		expect(listInsufficientSegments(segments).map(({ startMinutes, endMinutes }) => [startMinutes, endMinutes])).toEqual([
			[8 * 60, 12 * 60],
			[16 * 60, 20 * 60]
		]);
	});

	it('relève l’effectif demandé pendant une heure de pointe', () => {
		const presentIntervals = [
			{ startMinutes: 8 * 60, endMinutes: 20 * 60 },
			{ startMinutes: 8 * 60, endMinutes: 20 * 60 }
		];
		const peak = { startMinutes: 17 * 60, endMinutes: 19 * 60, requiredCount: 3 };
		const insufficient = listInsufficientSegments(computeStaffing(openingFrom8To20, presentIntervals, [peak], 2));
		expect(insufficient).toEqual([
			{ startMinutes: 17 * 60, endMinutes: 19 * 60, presentCount: 2, requiredCount: 3, isSufficient: false }
		]);
	});

	it('ne couvre pas la pause de midi quand l’ouverture est en deux plages', () => {
		const opening = [
			{ startMinutes: 9 * 60, endMinutes: 12 * 60 },
			{ startMinutes: 14 * 60, endMinutes: 19 * 60 }
		];
		const segments = computeStaffing(opening, [{ startMinutes: 9 * 60, endMinutes: 19 * 60 }], [], 1);
		expect(listInsufficientSegments(segments)).toEqual([]);
	});
});
