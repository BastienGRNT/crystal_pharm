import { describe, expect, it } from 'vitest';
import { addGracePeriod, planNextPaymentRetry } from './paymentRetrySchedule';

const firstFailureAt = new Date('2026-03-01T03:00:00Z');

describe('planNextPaymentRetry', () => {
	it('retries one day after the first failure', () => {
		expect(planNextPaymentRetry(firstFailureAt, 1)).toEqual({ outcome: 'retry', nextRetryAt: new Date('2026-03-02T03:00:00Z') });
	});

	it('then three and six days after it', () => {
		expect(planNextPaymentRetry(firstFailureAt, 2)).toEqual({ outcome: 'retry', nextRetryAt: new Date('2026-03-04T03:00:00Z') });
		expect(planNextPaymentRetry(firstFailureAt, 3)).toEqual({ outcome: 'retry', nextRetryAt: new Date('2026-03-07T03:00:00Z') });
	});

	it('gives up after the last retry', () => {
		expect(planNextPaymentRetry(firstFailureAt, 4)).toEqual({ outcome: 'give-up' });
	});
});

describe('addGracePeriod', () => {
	it('adds seven days', () => {
		expect(addGracePeriod(new Date('2026-03-01T00:00:00Z'))).toEqual(new Date('2026-03-08T00:00:00Z'));
	});
});
