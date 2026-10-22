import { describe, expect, it } from 'vitest';
import { computeCoverage, formatMinuteRange, listCoverageGaps } from './coverage';
import type { Shift } from './planning';

const shift = (startTime: string, endTime: string): Shift => ({
	id: `${startTime}-${endTime}`,
	employeeId: 'employee-1',
	date: '2026-10-22',
	startTime,
	endTime
});

const openingHours = { opensAt: '08:30', closesAt: '19:30' };

describe('computeCoverage', () => {
	it('couvre toute la journée quand les créneaux se relaient sans trou', () => {
		const segments = computeCoverage(openingHours, [shift('08:30', '14:00'), shift('13:30', '19:30')]);
		expect(listCoverageGaps(segments)).toEqual([]);
	});

	it('signale chaque trou entre l’ouverture et la fermeture', () => {
		const segments = computeCoverage(openingHours, [shift('09:00', '12:30'), shift('14:00', '18:00')]);
		expect(listCoverageGaps(segments).map(formatMinuteRange)).toEqual([
			'08:30–09:00',
			'12:30–14:00',
			'18:00–19:30'
		]);
	});

	it('ignore ce qui déborde des horaires d’ouverture', () => {
		const segments = computeCoverage(openingHours, [shift('07:00', '20:00')]);
		expect(segments).toEqual([{ startMinutes: 510, endMinutes: 1170, isCovered: true }]);
	});

	it('ne couvre rien sans créneau', () => {
		expect(listCoverageGaps(computeCoverage(openingHours, [])).map(formatMinuteRange)).toEqual(['08:30–19:30']);
	});
});
