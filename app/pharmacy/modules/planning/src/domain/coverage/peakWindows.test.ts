import { describe, expect, it } from 'vitest';
import { listRequirementWindowsOfDate, type PeakWindow } from './peakWindows';

const peak = (weekday: number): PeakWindow => ({ id: String(weekday), weekday, startTime: '17:00', endTime: '19:00', requiredCount: 4 });

describe('listRequirementWindowsOfDate', () => {
	it('garde seulement les pointes du jour de la semaine de la date', () => {
		// 2026-10-26 est un lundi.
		expect(listRequirementWindowsOfDate([peak(0), peak(1)], '2026-10-26')).toEqual([
			{ startMinutes: 1020, endMinutes: 1140, requiredCount: 4 }
		]);
	});

	it('ne rend rien un jour sans pointe', () => {
		expect(listRequirementWindowsOfDate([peak(0)], '2026-10-27')).toEqual([]);
	});
});
