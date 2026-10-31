import type { AvailableAppointmentSlot } from '@crystal-pharm/schema';
import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import type { AppointmentForm, AppointmentFormErrors, BookAppointment, ListAvailableSlots } from './createBookAppointment';

export type AppointmentFormStatus = 'editing' | 'sending' | 'requested' | 'slotTaken' | 'failed';
export type AvailableSlotsStatus = 'idle' | 'loading' | 'listed' | 'failed';

const emptyAppointmentForm: AppointmentForm = { slotId: '', firstName: '', lastName: '', phone: '', reason: '' };

/** L'état d'une prise de rendez-vous (jour, créneaux, coordonnées, envoi) : le layout n'écrit plus que le rendu. */
export function createAppointmentFormState(appointment: { listAvailableSlots: ListAvailableSlots; bookAppointment: BookAppointment }) {
  const [form, setForm] = createStore<AppointmentForm>({ ...emptyAppointmentForm });
  const [errorsByField, setErrorsByField] = createSignal<AppointmentFormErrors>({});
  const [status, setStatus] = createSignal<AppointmentFormStatus>('editing');
  const [chosenDay, setChosenDay] = createSignal<string>();
  const [availableSlots, setAvailableSlots] = createSignal<AvailableAppointmentSlot[]>([]);
  const [availableSlotsStatus, setAvailableSlotsStatus] = createSignal<AvailableSlotsStatus>('idle');

  function updateField<FieldName extends keyof AppointmentForm>(fieldName: FieldName, value: AppointmentForm[FieldName]): void {
    setForm(fieldName, value);
    setErrorsByField({ ...errorsByField(), [fieldName]: undefined });
  }

  /** `day` au format `2026-03-14`. Une réponse tardive d'un jour déjà abandonné est ignorée. */
  async function chooseDay(day: string): Promise<void> {
    setChosenDay(day);
    updateField('slotId', '');
    setAvailableSlots([]);
    setAvailableSlotsStatus('loading');
    const result = await appointment.listAvailableSlots(day);
    if (chosenDay() !== day) return;
    setAvailableSlots(result.outcome === 'listed' ? result.slots : []);
    setAvailableSlotsStatus(result.outcome === 'listed' ? 'listed' : 'failed');
  }

  async function send(): Promise<void> {
    setStatus('sending');
    const result = await appointment.bookAppointment({ ...form });
    setErrorsByField(result.outcome === 'invalid' ? result.errorsByField : {});
    setStatus(result.outcome === 'invalid' ? 'editing' : result.outcome);
    if (result.outcome === 'slotTaken' && chosenDay()) await chooseDay(chosenDay() ?? '');
  }

  return { form, updateField, errorsByField, status, chosenDay, chooseDay, availableSlots, availableSlotsStatus, send };
}

export type AppointmentFormState = ReturnType<typeof createAppointmentFormState>;
