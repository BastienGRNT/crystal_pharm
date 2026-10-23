import { describe, expect, it } from 'vitest';
import { computeCurrentPeriodEnd, computeMoneyBackGuaranteeEnd } from './subscriptionPeriod';

describe('computeCurrentPeriodEnd', () => {
	it('finit un mois après le début pendant le premier mois', () => {
		expect(computeCurrentPeriodEnd(new Date(2026, 9, 10), new Date(2026, 9, 23))).toEqual(new Date(2026, 10, 10));
	});

	it('suit les dates anniversaires les mois suivants', () => {
		expect(computeCurrentPeriodEnd(new Date(2026, 6, 10), new Date(2026, 9, 23))).toEqual(new Date(2026, 10, 10));
	});

	it('s’arrête au dernier jour d’un mois plus court', () => {
		expect(computeCurrentPeriodEnd(new Date(2026, 0, 31), new Date(2026, 1, 3))).toEqual(new Date(2026, 1, 28));
	});
});

describe('computeMoneyBackGuaranteeEnd', () => {
	it('dure 30 jours', () => {
		expect(computeMoneyBackGuaranteeEnd(new Date(Date.UTC(2026, 9, 1))).toISOString()).toBe('2026-10-31T00:00:00.000Z');
	});
});
