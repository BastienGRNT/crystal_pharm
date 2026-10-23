import { describe, expect, it } from 'vitest';
import { formatCentsForInput, formatEuros, parseEurosToCents } from './euroAmount';

const withoutNarrowSpaces = (text: string) => text.replace(/\s/g, ' ');

describe('les montants en euros', () => {
	it('affiche les euros ronds sans centimes', () => {
		expect(withoutNarrowSpaces(formatEuros(2900))).toBe('29 €');
		expect(withoutNarrowSpaces(formatEuros(3120))).toBe('31,20 €');
	});

	it('lit une saisie en euros', () => {
		expect(parseEurosToCents('29,9')).toBe(2990);
		expect(parseEurosToCents(' 29.90 € ')).toBe(2990);
		expect(parseEurosToCents('-3')).toBeUndefined();
		expect(parseEurosToCents('')).toBeUndefined();
	});

	it('pré-remplit un champ', () => {
		expect(formatCentsForInput(2900)).toBe('29');
		expect(formatCentsForInput(2990)).toBe('29,90');
		expect(formatCentsForInput(undefined)).toBe('');
	});
});
