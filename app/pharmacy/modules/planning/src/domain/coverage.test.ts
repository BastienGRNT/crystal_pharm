import { describe, expect, it } from 'vitest';
import type { WeeklyOpeningSchedule } from '@crystal-pharm/pharmacy-db/domain';
import {
	computeCoverage,
	computeCoverageOfOpeningPeriods,
	formatMinuteRange,
	listCoverageGaps,
	listOpeningPeriodsOfDate,
	spanOpeningPeriods
} from './coverage';
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

const morning = { opensAt: '08:30', closesAt: '12:30' };
const afternoon = { opensAt: '14:00', closesAt: '19:30' };

const weeklyOpeningSchedule: WeeklyOpeningSchedule = {
	monday: [morning, afternoon],
	tuesday: [morning, afternoon],
	wednesday: [morning, afternoon],
	thursday: [morning, afternoon],
	friday: [morning, afternoon],
	saturday: [morning],
	sunday: []
};

describe('listOpeningPeriodsOfDate', () => {
	it('lit les plages du jour de la semaine de la date', () => {
		expect(listOpeningPeriodsOfDate(weeklyOpeningSchedule, '2026-10-19')).toEqual([morning, afternoon]);
		expect(listOpeningPeriodsOfDate(weeklyOpeningSchedule, '2026-10-24')).toEqual([morning]);
	});

	it('n’ouvre pas un jour de fermeture, ni une pharmacie sans horaires saisis', () => {
		expect(listOpeningPeriodsOfDate(weeklyOpeningSchedule, '2026-10-25')).toEqual([]);
		expect(listOpeningPeriodsOfDate(undefined, '2026-10-19')).toEqual([]);
	});
});

describe('spanOpeningPeriods', () => {
	it('va de la première ouverture à la dernière fermeture', () => {
		expect(spanOpeningPeriods([morning, afternoon])).toEqual({ opensAt: '08:30', closesAt: '19:30' });
		expect(spanOpeningPeriods([])).toBeUndefined();
	});
});

describe('computeCoverageOfOpeningPeriods', () => {
	it('ne demande pas de pharmacien pendant la pause de midi', () => {
		const segments = computeCoverageOfOpeningPeriods([morning, afternoon], [shift('08:30', '12:30'), shift('14:00', '19:30')]);
		expect(listCoverageGaps(segments)).toEqual([]);
	});

	it('signale le trou de chaque plage', () => {
		const segments = computeCoverageOfOpeningPeriods([morning, afternoon], [shift('09:00', '12:30'), shift('14:00', '18:00')]);
		expect(listCoverageGaps(segments).map(formatMinuteRange)).toEqual(['08:30–09:00', '18:00–19:30']);
	});
});
