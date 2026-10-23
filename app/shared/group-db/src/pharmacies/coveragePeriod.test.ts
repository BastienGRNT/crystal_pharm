import { describe, expect, it } from 'vitest';
import { computeCoverageEnd } from './coveragePeriod';

describe('computeCoverageEnd', () => {
	it('s’arrête le 1er du mois suivant', () => {
		expect(computeCoverageEnd(new Date(2026, 9, 23, 15))).toEqual(new Date(2026, 10, 1));
	});

	it('passe à l’année suivante en décembre', () => {
		expect(computeCoverageEnd(new Date(2026, 11, 31, 23))).toEqual(new Date(2027, 0, 1));
	});
});
