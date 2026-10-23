import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { collectFieldErrors } from '../fieldErrors';
import { WeeklyOpeningScheduleSchema, type OpeningPeriod, type WeeklyOpeningSchedule } from './weeklyOpeningSchedule';

const morning: OpeningPeriod = { opensAt: '09:00', closesAt: '12:30' };
const afternoon: OpeningPeriod = { opensAt: '14:00', closesAt: '19:30' };

function scheduleOpenOnMondayOnly(mondayPeriods: OpeningPeriod[]): WeeklyOpeningSchedule {
	return { monday: mondayPeriods, tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] };
}

function collectScheduleErrors(schedule: unknown) {
	return collectFieldErrors(v.safeParse(WeeklyOpeningScheduleSchema, schedule).issues ?? []);
}

describe('WeeklyOpeningScheduleSchema', () => {
	it('accepte une journée avec une coupure', () => {
		expect(v.is(WeeklyOpeningScheduleSchema, scheduleOpenOnMondayOnly([morning, afternoon]))).toBe(true);
	});

	it('range les plages de la journée dans l’ordre', () => {
		const schedule = v.parse(WeeklyOpeningScheduleSchema, scheduleOpenOnMondayOnly([afternoon, morning]));

		expect(schedule.monday).toEqual([morning, afternoon]);
	});

	it('accepte deux plages qui se touchent', () => {
		const touchingPeriods = [morning, { opensAt: '12:30', closesAt: '13:00' }];

		expect(v.is(WeeklyOpeningScheduleSchema, scheduleOpenOnMondayOnly(touchingPeriods))).toBe(true);
	});

	it('refuse une fermeture avant l’ouverture, sur le jour concerné', () => {
		const errors = collectScheduleErrors(scheduleOpenOnMondayOnly([{ opensAt: '19:00', closesAt: '09:00' }]));

		expect(errors).toEqual({ monday: 'L’heure de fermeture doit venir après l’heure d’ouverture.' });
	});

	it('refuse deux plages qui se chevauchent', () => {
		const errors = collectScheduleErrors(scheduleOpenOnMondayOnly([morning, { opensAt: '12:00', closesAt: '19:00' }]));

		expect(errors).toEqual({ monday: 'Deux plages de la journée se chevauchent.' });
	});

	it('refuse une heure mal écrite', () => {
		const errors = collectScheduleErrors(scheduleOpenOnMondayOnly([{ opensAt: '9h', closesAt: '12:30' }]));

		expect(errors).toEqual({ monday: 'Heure attendue au format HH:MM.' });
	});

	it('refuse une semaine sans aucun jour d’ouverture', () => {
		const errors = collectScheduleErrors(scheduleOpenOnMondayOnly([]));

		expect(errors).toEqual({ form: 'Indiquez au moins un jour d’ouverture.' });
	});
});
