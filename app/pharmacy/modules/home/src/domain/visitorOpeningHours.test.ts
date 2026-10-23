import { expect, it } from 'vitest';
import { suggestUsualPharmacyOpeningHours, toWeeklyOpeningSchedule } from './openingHoursDraft';
import { describeOpeningHoursForVisitor } from './visitorOpeningHours';

it('affiche chaque jour du lundi au dimanche, ses plages écrites comme sur le site, et aucune plage un jour fermé', () => {
	const visitorOpeningDays = describeOpeningHoursForVisitor(toWeeklyOpeningSchedule(suggestUsualPharmacyOpeningHours()));

	expect(visitorOpeningDays.map((day) => day.weekdayLabel)).toEqual([
		'Lundi',
		'Mardi',
		'Mercredi',
		'Jeudi',
		'Vendredi',
		'Samedi',
		'Dimanche'
	]);
	expect(visitorOpeningDays[0]).toEqual({
		weekdayLabel: 'Lundi',
		openingPeriodLabels: ['09:00 – 12:30', '14:00 – 19:30'],
		isClosed: false
	});
	expect(visitorOpeningDays[6]).toEqual({ weekdayLabel: 'Dimanche', openingPeriodLabels: [], isClosed: true });
});
