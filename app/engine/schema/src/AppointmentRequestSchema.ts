import * as v from 'valibot';

const requiredText = (message: string) => v.pipe(v.string(), v.trim(), v.nonEmpty(message));

/** Un créneau proposé par l'API : `slotId` est opaque, seule l'API sait à quelle personne de l'équipe il correspond. */
export const AvailableAppointmentSlotSchema = v.object({
  slotId: v.pipe(v.string(), v.nonEmpty()),
  startsAt: v.pipe(v.string(), v.isoTimestamp()),
  endsAt: v.pipe(v.string(), v.isoTimestamp()),
});

export const AppointmentRequestSchema = v.object({
  slotId: v.pipe(v.string(), v.nonEmpty('Choisissez un créneau.')),
  firstName: requiredText('Indiquez votre prénom.'),
  lastName: requiredText('Indiquez votre nom.'),
  phone: v.pipe(v.string(), v.trim(), v.regex(/^(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/, 'Indiquez un numéro de téléphone valide, par exemple 06 12 34 56 78.')),
  reason: requiredText('Indiquez le motif du rendez-vous.'),
});

export type AvailableAppointmentSlot = v.InferOutput<typeof AvailableAppointmentSlotSchema>;
export type AppointmentRequest = v.InferOutput<typeof AppointmentRequestSchema>;
