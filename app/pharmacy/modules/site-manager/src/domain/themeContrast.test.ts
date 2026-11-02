import { describe, expect, it } from 'vitest';
import { calculateContrastRatio, listContrastWarnings } from './themeContrast';

describe('calculateContrastRatio', () => {
	it('is 21 for black on white and 1 for identical colors', () => {
		expect(calculateContrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
		expect(calculateContrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
	});
});

describe('listContrastWarnings', () => {
	const contrastPairs = [
		{ label: 'Texte sur le fond', foreground: 'textColor', background: 'backgroundColor' },
		{ label: 'Texte blanc des boutons', foreground: '#ffffff', background: 'accentColor' },
	];

	it('warns about the pairs that are too pale, and only those', () => {
		const warnings = listContrastWarnings(contrastPairs, { textColor: '#cccccc', backgroundColor: '#ffffff', accentColor: '#0a7a4f' });

		expect(warnings.map((warning) => warning.label)).toEqual(['Texte sur le fond']);
	});

	it('ignores a pair whose color is not a valid hex yet', () => {
		expect(listContrastWarnings(contrastPairs, { textColor: '#ccc', backgroundColor: '#ffffff', accentColor: '' })).toEqual([]);
	});
});
