import * as v from 'valibot';

const TimeOfDaySchema = v.pipe(v.string(), v.regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM.'));

/** Une journée sans période est une journée de fermeture. */
const DailyOpeningPeriodsSchema = v.array(v.object({ opensAt: TimeOfDaySchema, closesAt: TimeOfDaySchema }));

/** Une garde saisie par la pharmacie, avec un fuseau horaire explicite (ex. 2026-10-21T19:00:00+02:00). */
const OnDutyPeriodSchema = v.object({
  startsAt: v.pipe(v.string(), v.isoTimestamp()),
  endsAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const OpeningHoursSectionDataSchema = v.object({
  weeklySchedule: v.object({
    monday: DailyOpeningPeriodsSchema,
    tuesday: DailyOpeningPeriodsSchema,
    wednesday: DailyOpeningPeriodsSchema,
    thursday: DailyOpeningPeriodsSchema,
    friday: DailyOpeningPeriodsSchema,
    saturday: DailyOpeningPeriodsSchema,
    sunday: DailyOpeningPeriodsSchema,
  }),
  onDutyPeriods: v.optional(v.array(OnDutyPeriodSchema), []),
});

export type OpeningHoursSectionData = v.InferOutput<typeof OpeningHoursSectionDataSchema>;
export type Weekday = keyof OpeningHoursSectionData['weeklySchedule'];
export type OnDutyPeriod = v.InferOutput<typeof OnDutyPeriodSchema>;
