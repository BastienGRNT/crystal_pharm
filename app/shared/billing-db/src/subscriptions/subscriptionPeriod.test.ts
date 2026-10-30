import { describe, expect, it } from 'vitest';
import { computeMoneyBackGuaranteeEnd } from './subscriptionPeriod';

describe('computeMoneyBackGuaranteeEnd', () => {
	it('dure 30 jours', () => {
		expect(computeMoneyBackGuaranteeEnd(new Date(Date.UTC(2026, 9, 1))).toISOString()).toBe('2026-10-31T00:00:00.000Z');
	});
});
