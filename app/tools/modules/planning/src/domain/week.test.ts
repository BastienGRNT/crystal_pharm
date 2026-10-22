import { describe, expect, it } from 'vitest';
import {
	formatDayName,
	formatDayTitle,
	formatWeekLabel,
	formatWeekParameter,
	formatWeekRange,
	getIsoWeek,
	listWeekDays,
	parseDayParameter,
	parseWeekParameter,
	toIsoDate
} from './week';

const calendarDay = (isoDate: string): Date => new Date(`${isoDate}T00:00:00Z`);

describe('getIsoWeek', () => {
	it('numérote les semaines selon la norme ISO', () => {
		expect(getIsoWeek(calendarDay('2026-09-28'))).toEqual({ year: 2026, weekNumber: 40 });
		expect(getIsoWeek(calendarDay('2026-10-04'))).toEqual({ year: 2026, weekNumber: 40 });
	});

	it('rattache les premiers jours de janvier à la dernière semaine de l’année précédente', () => {
		expect(getIsoWeek(calendarDay('2027-01-01'))).toEqual({ year: 2026, weekNumber: 53 });
	});
});

describe('parseWeekParameter', () => {
	const today = calendarDay('2026-10-22');

	it('renvoie le lundi de la semaine demandée', () => {
		expect(toIsoDate(parseWeekParameter('2026-W40', today))).toBe('2026-09-28');
	});

	it('revient à la semaine en cours sans paramètre ou avec un paramètre invalide', () => {
		expect(toIsoDate(parseWeekParameter(null, today))).toBe('2026-10-19');
		expect(toIsoDate(parseWeekParameter('n-importe-quoi', today))).toBe('2026-10-19');
		expect(toIsoDate(parseWeekParameter('2025-W53', today))).toBe('2026-10-19');
	});

	it('relit ce que formatWeekParameter écrit', () => {
		const monday = calendarDay('2026-12-28');
		expect(formatWeekParameter(monday)).toBe('2026-W53');
		expect(toIsoDate(parseWeekParameter(formatWeekParameter(monday), today))).toBe('2026-12-28');
	});
});

describe('formatage', () => {
	it('écrit la plage de la semaine en clair', () => {
		expect(formatWeekRange(calendarDay('2026-09-28'))).toBe('Semaine du 28 septembre au 4 octobre');
		expect(formatWeekRange(calendarDay('2026-10-05'))).toBe('Semaine du 5 au 11 octobre');
	});

	it('écrit le libellé de semaine et les jours', () => {
		const monday = calendarDay('2026-09-28');
		expect(formatWeekLabel(monday)).toBe('Semaine 40');
		expect(listWeekDays(monday).map(formatDayName)).toEqual(['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']);
	});
});

describe('jour affiché', () => {
	const today = calendarDay('2026-10-22');

	it('lit le jour demandé, sinon aujourd’hui', () => {
		expect(toIsoDate(parseDayParameter('2026-10-06', today))).toBe('2026-10-06');
		expect(toIsoDate(parseDayParameter(null, today))).toBe('2026-10-22');
		expect(toIsoDate(parseDayParameter('2026-02-31', today))).toBe('2026-10-22');
	});

	it('écrit le jour en toutes lettres', () => {
		expect(formatDayTitle(today)).toBe('Jeudi 22 octobre');
	});
});
