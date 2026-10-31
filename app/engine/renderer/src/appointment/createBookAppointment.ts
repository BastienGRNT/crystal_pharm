import {
  AppointmentRequestSchema,
  type AppointmentConfirmation,
  type AppointmentOptions,
  type AppointmentRequest,
  type AvailableAppointmentDay,
  type AvailableAppointmentSlot,
} from '@crystal-pharm/schema';
import * as v from 'valibot';

export type AppointmentForm = { slotId: string; reasonId: string; firstName: string; lastName: string; phone: string; note: string };
export type AppointmentFormErrors = Partial<Record<keyof AppointmentForm, string>>;

export type AppointmentOptionsResult = { outcome: 'loaded'; options: AppointmentOptions } | { outcome: 'failed' };
export type AvailableDaysResult = { outcome: 'listed'; days: AvailableAppointmentDay[] } | { outcome: 'failed' };
export type AvailableSlotsResult = { outcome: 'listed'; slots: AvailableAppointmentSlot[] } | { outcome: 'failed' };

export type AppointmentBookingResult =
  | { outcome: 'requested'; confirmation: AppointmentConfirmation }
  | { outcome: 'invalid'; errorsByField: AppointmentFormErrors }
  | { outcome: 'slotTaken' }
  | { outcome: 'reasonUnavailable' }
  | { outcome: 'failed' };

/** Fournie par l'app qui sert le site : elle seule sait où demander les motifs, les créneaux et le rendez-vous, et pour quel tenant. */
export type AppointmentGateway = {
  getOptions: () => Promise<AppointmentOptionsResult>;
  /** `firstDay` et `lastDay` au format `2026-03-14`, 62 jours au plus. */
  listAvailableDays: (query: { reasonId: string; firstDay: string; lastDay: string }) => Promise<AvailableDaysResult>;
  listAvailableSlots: (query: { reasonId: string; day: string }) => Promise<AvailableSlotsResult>;
  requestAppointment: (request: AppointmentRequest) => Promise<Exclude<AppointmentBookingResult, { outcome: 'invalid' }>>;
};

export type BookAppointment = (form: AppointmentForm) => Promise<AppointmentBookingResult>;

/** Ce qu'un layout reçoit pour une prise de rendez-vous : tout passe par ces fonctions, validées ou non-validantes. */
export type AppointmentActions = {
  getOptions: AppointmentGateway['getOptions'];
  listAvailableDays: AppointmentGateway['listAvailableDays'];
  listAvailableSlots: AppointmentGateway['listAvailableSlots'];
  bookAppointment: BookAppointment;
};

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
    const request = v.parse(AppointmentRequestSchema, form);
    return gateway.requestAppointment(request.note === '' ? { ...request, note: undefined } : request);
  };
}

export function createAppointmentActions(gateway: AppointmentGateway): AppointmentActions {
  return {
    getOptions: gateway.getOptions,
    listAvailableDays: gateway.listAvailableDays,
    listAvailableSlots: gateway.listAvailableSlots,
    bookAppointment: createBookAppointment(gateway),
  };
}
