import { describe, expect, it } from 'vitest';
import {
	formatDayColumnTitle,
	formatFullDay,
	formatShortDay,
	formatWeekRange,
	getMondayOfWeek,
	parseDayParameter,
	toIsoDate
} from './day';

const calendarDay = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);

describe('parseDayParameter', () => {
	const today = calendarDay('2026-10-22');

	it('lit un jour valide', () => {
		expect(toIsoDate(parseDayParameter('2026-11-03', today))).toBe('2026-11-03');
	});

	it('revient à aujourd’hui sans paramètre, ou pour un jour qui n’existe pas', () => {
		expect(parseDayParameter(null, today)).toBe(today);
		expect(parseDayParameter('2026-02-30', today)).toBe(today);
		expect(parseDayParameter('demain', today)).toBe(today);
	});
});

describe('formatShortDay', () => {
	it('écrit la date courte en clair', () => {
		expect(formatShortDay(calendarDay('2026-10-22'))).toBe('jeu. 22 oct.');
	});
});

describe('formatFullDay', () => {
	it('écrit la date longue en clair', () => {
		expect(formatFullDay(calendarDay('2026-10-22'))).toBe('jeudi 22 octobre');
	});
});

describe('getMondayOfWeek', () => {
	it('revient au lundi, y compris depuis un dimanche', () => {
		expect(toIsoDate(getMondayOfWeek(calendarDay('2026-10-22')))).toBe('2026-10-19');
		expect(toIsoDate(getMondayOfWeek(calendarDay('2026-10-25')))).toBe('2026-10-19');
	});
});

describe('formatWeekRange', () => {
	it('n’écrit le mois qu’une fois dans le même mois', () => {
		expect(formatWeekRange(calendarDay('2026-10-19'))).toBe('19 → 25 oct.');
	});

	it('écrit les deux mois à cheval sur deux mois', () => {
		expect(formatWeekRange(calendarDay('2026-09-28'))).toBe('28 sept. → 4 oct.');
	});
});

describe('formatDayColumnTitle', () => {
	it('écrit le jour court et son numéro', () => {
		expect(formatDayColumnTitle(calendarDay('2026-10-19'))).toBe('lun. 19');
	});
});
