import * as v from 'valibot';

const requiredText = (message: string) => v.pipe(v.string(), v.trim(), v.nonEmpty(message));

export const AppointmentNoteMaximumLength = 500;

/** Un jour au format `2026-03-14`. */
const DaySchema = v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}$/));

/** Un motif que la pharmacie propose : `durationMinutes` est ce qui est réservé dans son agenda. */
export const AppointmentReasonOptionSchema = v.object({
  id: v.pipe(v.string(), v.nonEmpty()),
  label: v.pipe(v.string(), v.nonEmpty()),
  description: v.nullish(v.string()),
  preparationNote: v.nullish(v.string()),
  durationMinutes: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

/** Ce que le formulaire peut proposer au Visitor : la prise de rendez-vous est peut-être en pause, ou sans motif. */
export const AppointmentOptionsSchema = v.object({
  isBookingOpen: v.boolean(),
  maximumAdvanceDays: v.pipe(v.number(), v.integer(), v.minValue(0)),
  reasons: v.array(AppointmentReasonOptionSchema),
});

export const AvailableAppointmentDaySchema = v.object({
  day: DaySchema,
  freeSlotCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

/** Un créneau proposé par l'API : `slotId` est opaque, seule l'API sait à quelle personne de l'équipe il correspond. */
export const AvailableAppointmentSlotSchema = v.object({
  slotId: v.pipe(v.string(), v.nonEmpty()),
  startsAt: v.pipe(v.string(), v.isoTimestamp()),
  endsAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const AppointmentConfirmationSchema = v.object({
  startsAt: v.pipe(v.string(), v.isoTimestamp()),
  endsAt: v.pipe(v.string(), v.isoTimestamp()),
  reasonLabel: v.string(),
  /** Faux tant que la pharmacie n'a pas validé la demande. */
  isConfirmed: v.boolean(),
  confirmationMessage: v.nullish(v.string()),
});

export const AppointmentRequestSchema = v.object({
  slotId: v.pipe(v.string(), v.nonEmpty('Choisissez un créneau.')),
  reasonId: v.pipe(v.string(), v.nonEmpty('Choisissez un motif.')),
  firstName: requiredText('Indiquez votre prénom.'),
  lastName: requiredText('Indiquez votre nom.'),
  phone: v.pipe(v.string(), v.trim(), v.regex(/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, 'Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.')),
  note: v.optional(
    v.pipe(v.string(), v.trim(), v.maxLength(AppointmentNoteMaximumLength, `Votre message est limité à ${AppointmentNoteMaximumLength} caractères.`)),
  ),
});

export type AppointmentReasonOption = v.InferOutput<typeof AppointmentReasonOptionSchema>;
export type AppointmentOptions = v.InferOutput<typeof AppointmentOptionsSchema>;
export type AvailableAppointmentDay = v.InferOutput<typeof AvailableAppointmentDaySchema>;
export type AvailableAppointmentSlot = v.InferOutput<typeof AvailableAppointmentSlotSchema>;
export type AppointmentConfirmation = v.InferOutput<typeof AppointmentConfirmationSchema>;
export type AppointmentRequest = v.InferOutput<typeof AppointmentRequestSchema>;
