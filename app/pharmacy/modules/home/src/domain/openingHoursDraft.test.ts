import { describe, expect, it } from 'vitest';
import {
	addBreak,
	applyMondayToOtherWorkingDays,
	canAddBreak,
	suggestUsualPharmacyOpeningHours,
	toOpeningHoursDraft,
	toWeeklyOpeningSchedule
} from './openingHoursDraft';

const usualDay = [
	{ opensAt: '09:00', closesAt: '12:30' },
	{ opensAt: '14:00', closesAt: '19:30' }
];

describe('suggestUsualPharmacyOpeningHours', () => {
	it('propose le lundi au samedi avec une coupure, et le dimanche fermé', () => {
		const schedule = toWeeklyOpeningSchedule(suggestUsualPharmacyOpeningHours());

		expect(schedule.monday).toEqual(usualDay);
		expect(schedule.saturday).toEqual(usualDay);
		expect(schedule.sunday).toEqual([]);
	});
});

describe('toOpeningHoursDraft', () => {
	it('prépare des plages pour un jour fermé, sans l’ouvrir', () => {
		const draft = toOpeningHoursDraft({ ...toWeeklyOpeningSchedule(suggestUsualPharmacyOpeningHours()), monday: [] });

		expect(draft.monday).toEqual({ isOpen: false, periods: usualDay });
		expect(toWeeklyOpeningSchedule(draft).monday).toEqual([]);
	});
});

describe('applyMondayToOtherWorkingDays', () => {
	it('copie le lundi du mardi au vendredi, sans toucher au week-end', () => {
		const draft = suggestUsualPharmacyOpeningHours();
		draft.monday = { isOpen: true, periods: [{ opensAt: '08:30', closesAt: '20:00' }] };

		const schedule = toWeeklyOpeningSchedule(applyMondayToOtherWorkingDays(draft));

		expect(schedule.friday).toEqual([{ opensAt: '08:30', closesAt: '20:00' }]);
		expect(schedule.saturday).toEqual(usualDay);
		expect(schedule.sunday).toEqual([]);
	});

	it('donne à chaque jour ses propres plages', () => {
		const draft = applyMondayToOtherWorkingDays(suggestUsualPharmacyOpeningHours());

		expect(draft.tuesday.periods).not.toBe(draft.monday.periods);
	});
});

describe('addBreak', () => {
	it('coupe à l’heure du déjeuner une journée continue', () => {
		expect(addBreak([{ opensAt: '08:30', closesAt: '20:00' }])).toEqual([
			{ opensAt: '08:30', closesAt: '12:30' },
			{ opensAt: '14:00', closesAt: '20:00' }
		]);
	});

	it('coupe en son milieu une plage qui ne couvre pas le déjeuner', () => {
		expect(addBreak([{ opensAt: '15:00', closesAt: '19:00' }])).toEqual([
			{ opensAt: '15:00', closesAt: '16:45' },
			{ opensAt: '17:15', closesAt: '19:00' }
		]);
	});

	it('ne coupe ni une journée déjà coupée, ni une plage trop courte', () => {
		expect(canAddBreak(usualDay)).toBe(false);
		expect(canAddBreak([{ opensAt: '09:00', closesAt: '09:45' }])).toBe(false);
		expect(addBreak(usualDay)).toEqual(usualDay);
	});
});
