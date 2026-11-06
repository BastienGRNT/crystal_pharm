import { describe, expect, it } from 'vitest';
import { formatDuration, includeCurrentChoice, summarizeWeeklyHours, type WeeklyAvailabilityWindow } from './appointmentConfiguration';

const window = (isoDayOfWeek: number, startTime: string, endTime: string): WeeklyAvailabilityWindow => ({
	employeeId: 'employee',
	isoDayOfWeek,
	startTime,
	endTime
});

describe('summarizeWeeklyHours', () => {
	it('regroupe les jours qui se suivent avec les mêmes plages', () => {
		const windows = [1, 2, 3, 4, 5].flatMap((day) => [window(day, '09:00', '12:00'), window(day, '14:00', '18:00')]);
		expect(summarizeWeeklyHours([...windows, window(6, '09:00', '12:00')])).toBe('Lun → Ven 9:00–12:00, 14:00–18:00 · Sam 9:00–12:00');
	});

	it('ne regroupe pas deux jours séparés par un jour sans rendez-vous', () => {
		expect(summarizeWeeklyHours([window(1, '09:00', '12:00'), window(3, '09:00', '12:00')])).toBe('Lun 9:00–12:00 · Mer 9:00–12:00');
	});

	it('dit quand la personne ne reçoit pas', () => {
		expect(summarizeWeeklyHours([])).toBe('Ne reçoit pas sur rendez-vous');
	});
});

describe('formatDuration', () => {
	it('écrit les durées comme on les dit', () => {
		expect([0, 15, 60, 90, 1440, 2880].map(formatDuration)).toEqual(['Aucun', '15 min', '1 h', '1 h 30', '1 jour', '2 jours']);
	});
});

describe('includeCurrentChoice', () => {
	it('garde une valeur réglée hors de la liste, à sa place', () => {
		expect(includeCurrentChoice([0, 30, 60], 45)).toEqual([0, 30, 45, 60]);
		expect(includeCurrentChoice([0, 30, 60], 30)).toEqual([0, 30, 60]);
	});
});
