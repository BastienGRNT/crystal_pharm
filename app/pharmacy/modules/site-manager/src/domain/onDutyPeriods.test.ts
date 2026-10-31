import { describe, expect, it } from 'vitest';
import { readOnDutyPeriodDrafts, toOnDutyPeriod, toOnDutyPeriodDraft } from './onDutyPeriods';

describe('les gardes de la pharmacie', () => {
	it('keeps a same-day period on the same day, with the Paris offset of that day', () => {
		expect(toOnDutyPeriod({ day: '2026-07-14', startTime: '08:00', endTime: '20:00' })).toEqual({
			startsAt: '2026-07-14T08:00:00+02:00',
			endsAt: '2026-07-14T20:00:00+02:00'
		});
	});

	it('ends a night period the next day', () => {
		expect(toOnDutyPeriod({ day: '2026-12-24', startTime: '19:00', endTime: '08:00' })).toEqual({
			startsAt: '2026-12-24T19:00:00+01:00',
			endsAt: '2026-12-25T08:00:00+01:00'
		});
	});

	it('follows the clock change in the middle of a night period', () => {
		expect(toOnDutyPeriod({ day: '2026-10-24', startTime: '19:00', endTime: '08:00' })).toEqual({
			startsAt: '2026-10-24T19:00:00+02:00',
			endsAt: '2026-10-25T08:00:00+01:00'
		});
	});

	it('refuses a period that starts and ends at the same time', () => {
		expect(toOnDutyPeriod({ day: '2026-07-14', startTime: '08:00', endTime: '08:00' })).toBeUndefined();
	});

	it('gives back the draft that was typed', () => {
		const draft = { day: '2026-12-24', startTime: '19:00', endTime: '08:00' };
		expect(toOnDutyPeriodDraft(toOnDutyPeriod(draft)!)).toEqual(draft);
	});

	it('drops the periods that are over and sorts the others', () => {
		const reading = readOnDutyPeriodDrafts(
			[
				{ day: '2026-11-10', startTime: '19:00', endTime: '08:00' },
				{ day: '2026-10-01', startTime: '19:00', endTime: '08:00' },
				{ day: '2026-11-03', startTime: '19:00', endTime: '08:00' }
			],
			new Date('2026-10-31T12:00:00Z')
		);

		expect(reading).toEqual({
			success: true,
			periods: [
				{ startsAt: '2026-11-03T19:00:00+01:00', endsAt: '2026-11-04T08:00:00+01:00' },
				{ startsAt: '2026-11-10T19:00:00+01:00', endsAt: '2026-11-11T08:00:00+01:00' }
			]
		});
	});
});
