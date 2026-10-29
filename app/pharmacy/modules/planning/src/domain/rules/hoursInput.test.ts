import { describe, expect, it } from 'vitest';
import { formatCentsAsEurosInput, formatMinutesAsHoursInput, parseEurosToCents, parseHoursToMinutes } from './hoursInput';

describe('parseHoursToMinutes', () => {
	it('lit des heures avec une virgule ou un point', () => {
		expect(parseHoursToMinutes('7,5')).toBe(450);
		expect(parseHoursToMinutes('35')).toBe(2100);
		expect(parseHoursToMinutes('0.25')).toBe(15);
	});

	it('refuse ce qui n’est pas un nombre positif', () => {
		expect(parseHoursToMinutes('')).toBeUndefined();
		expect(parseHoursToMinutes('-3')).toBeUndefined();
		expect(parseHoursToMinutes('abc')).toBeUndefined();
	});
});

describe('parseEurosToCents', () => {
	it('lit un montant à deux décimales au plus', () => {
		expect(parseEurosToCents('12,50')).toBe(1250);
		expect(parseEurosToCents('11')).toBe(1100);
		expect(parseEurosToCents('11,999')).toBeUndefined();
	});
});

describe('formatage des champs', () => {
	it('remet les valeurs stockées sous la forme saisie', () => {
		expect(formatMinutesAsHoursInput(450)).toBe('7,5');
		expect(formatCentsAsEurosInput(1250)).toBe('12,50');
	});
});
