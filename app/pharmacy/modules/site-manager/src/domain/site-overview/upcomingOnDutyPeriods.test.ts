import { describe, expect, it } from 'vitest';
import { summarizeUpcomingOnDutyPeriod } from './upcomingOnDutyPeriods';

const nightPeriod = { startsAt: '2026-11-07T19:00:00+01:00', endsAt: '2026-11-08T08:00:00+01:00' };

describe('summarizeUpcomingOnDutyPeriod', () => {
	it('names the starting day and the hours in Paris time', () => {
		const summary = summarizeUpcomingOnDutyPeriod(nightPeriod, new Date('2026-11-01T10:00:00Z'));

		expect(summary.dayLabel).toBe('sam. 7 nov.');
		expect(summary.hoursLabel).toBe('19:00 → 08:00');
		expect(summary.endLabel).toBe('Fin dimanche 8 novembre à 08:00');
		expect(summary.isOngoing).toBe(false);
	});

	it('tells when the period is under way', () => {
		const summary = summarizeUpcomingOnDutyPeriod(nightPeriod, new Date('2026-11-07T23:00:00Z'));

		expect(summary.isOngoing).toBe(true);
	});
});
