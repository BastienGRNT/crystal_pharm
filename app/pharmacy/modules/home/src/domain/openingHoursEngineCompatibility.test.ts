import { WeeklyOpeningScheduleSchema } from '@crystal-pharm/pharmacy-db/domain';
import { OpeningHoursSectionDataSchema, type OpeningHoursSectionData } from '@crystal-pharm/schema';
import * as v from 'valibot';
import { expect, it } from 'vitest';
import { suggestUsualPharmacyOpeningHours, toWeeklyOpeningSchedule } from './openingHoursDraft';

// Le site transmettra au moteur les horaires de la fiche tels quels : ce test
// casse (à la compilation ou à l'exécution) si les deux formes divergent.
it('des horaires acceptés par la fiche de la pharmacie sont acceptés tels quels par le moteur', () => {
	const weeklyOpeningSchedule = v.parse(
		WeeklyOpeningScheduleSchema,
		toWeeklyOpeningSchedule(suggestUsualPharmacyOpeningHours())
	);
	const engineWeeklySchedule: OpeningHoursSectionData['weeklySchedule'] = weeklyOpeningSchedule;

	expect(v.is(OpeningHoursSectionDataSchema, { weeklySchedule: engineWeeklySchedule })).toBe(true);
});
