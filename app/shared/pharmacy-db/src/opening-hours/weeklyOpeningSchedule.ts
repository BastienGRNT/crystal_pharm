import * as v from 'valibot';

// La même forme que `weeklySchedule` dans `engine/schema` : le site les
// transmet au moteur telles quelles.

export const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

export type Weekday = (typeof weekdays)[number];

const TimeOfDaySchema = v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM.'));

const OpeningPeriodSchema = v.pipe(
	v.object({ opensAt: TimeOfDaySchema, closesAt: TimeOfDaySchema }),
	v.check(({ opensAt, closesAt }) => opensAt < closesAt, 'L’heure de fermeture doit venir après l’heure d’ouverture.')
);

export type OpeningPeriod = v.InferOutput<typeof OpeningPeriodSchema>;

function sortByOpeningTime(periods: OpeningPeriod[]): OpeningPeriod[] {
	return periods.toSorted((first, second) => first.opensAt.localeCompare(second.opensAt));
}

// Les heures « HH:MM » se comparent comme du texte. Deux plages qui se
// touchent (12:30 – 12:30) ne se chevauchent pas.
function hasNoOverlap(sortedPeriods: OpeningPeriod[]): boolean {
	return sortedPeriods.every((period, periodIndex) => {
		const previousPeriod = sortedPeriods[periodIndex - 1];
		return !previousPeriod || previousPeriod.closesAt <= period.opensAt;
	});
}

/** Une journée sans plage est une journée de fermeture. */
const DailyOpeningPeriodsSchema = v.pipe(
	v.array(OpeningPeriodSchema),
	v.transform(sortByOpeningTime),
	v.check(hasNoOverlap, 'Deux plages de la journée se chevauchent.')
);

export const WeeklyOpeningScheduleSchema = v.pipe(
	v.object({
		monday: DailyOpeningPeriodsSchema,
		tuesday: DailyOpeningPeriodsSchema,
		wednesday: DailyOpeningPeriodsSchema,
		thursday: DailyOpeningPeriodsSchema,
		friday: DailyOpeningPeriodsSchema,
		saturday: DailyOpeningPeriodsSchema,
		sunday: DailyOpeningPeriodsSchema
	} satisfies Record<Weekday, typeof DailyOpeningPeriodsSchema>),
	v.check(
		(weeklySchedule) => weekdays.some((weekday) => weeklySchedule[weekday].length > 0),
		'Indiquez au moins un jour d’ouverture.'
	)
);

export type WeeklyOpeningSchedule = v.InferOutput<typeof WeeklyOpeningScheduleSchema>;
