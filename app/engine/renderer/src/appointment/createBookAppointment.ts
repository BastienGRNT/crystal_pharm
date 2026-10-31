import { AppointmentRequestSchema, type AppointmentRequest, type AvailableAppointmentSlot } from '@crystal-pharm/schema';
import * as v from 'valibot';

export type AppointmentForm = { slotId: string; firstName: string; lastName: string; phone: string; reason: string };
export type AppointmentFormErrors = Partial<Record<keyof AppointmentForm, string>>;

export type AvailableSlotsResult = { outcome: 'listed'; slots: AvailableAppointmentSlot[] } | { outcome: 'failed' };

export type AppointmentBookingResult =
  | { outcome: 'requested' }
  | { outcome: 'invalid'; errorsByField: AppointmentFormErrors }
  | { outcome: 'slotTaken' }
  | { outcome: 'failed' };

/** Fournie par l'app qui sert le site : elle seule sait où demander les créneaux et le rendez-vous, et pour quel tenant. */
export type AppointmentGateway = {
  /** `day` au format `2026-03-14`. */
  listAvailableSlots: (day: string) => Promise<AvailableSlotsResult>;
  requestAppointment: (request: AppointmentRequest) => Promise<{ outcome: 'requested' } | { outcome: 'slotTaken' } | { outcome: 'failed' }>;
};

export type ListAvailableSlots = AppointmentGateway['listAvailableSlots'];
export type BookAppointment = (form: AppointmentForm) => Promise<AppointmentBookingResult>;

export function validateAppointmentForm(form: AppointmentForm): AppointmentFormErrors {
  const result = v.safeParse(AppointmentRequestSchema, form);
  if (result.success) return {};
  const errorsByField: AppointmentFormErrors = {};
  for (const issue of result.issues) {
    const fieldName = issue.path?.[0]?.key;
    if (typeof fieldName === 'string' && fieldName in form) errorsByField[fieldName as keyof AppointmentForm] ??= issue.message;
  }
  return errorsByField;
}

/** Le seul moyen pour un layout de demander un rendez-vous : rien ne part sans avoir été validé par le schéma de l'API. */
export function createBookAppointment(gateway: AppointmentGateway): BookAppointment {
  return async (form) => {
    const errorsByField = validateAppointmentForm(form);
    if (Object.keys(errorsByField).length > 0) return { outcome: 'invalid', errorsByField };
    return gateway.requestAppointment(v.parse(AppointmentRequestSchema, form));
  };
}
