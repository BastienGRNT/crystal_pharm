import { For, Show } from 'solid-js';
import { createAppointmentFormState, type AppointmentModuleProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormField } from '../molecules/FormField';

type BuiltInAppointmentProps = Extract<AppointmentModuleProps, { mode: 'builtIn' }>;

export function AppointmentPanel(props: AppointmentModuleProps) {
  return (
    <section class="at-section at-appointment">
      <SectionTitle>Rendez-vous</SectionTitle>
      <div class="at-section__content">
        {props.mode === 'externalLink' ? <ArrowLink href={props.appointmentPath}>Prendre rendez-vous</ArrowLink> : <AppointmentBooking {...props} />}
      </div>
    </section>
  );
}

function AppointmentBooking(props: BuiltInAppointmentProps) {
  const state = createAppointmentFormState(props);
  const { form, updateField, errorsByField } = state;

  return (
    <Show when={state.status() !== 'requested'} fallback={<p>Demande envoyée. Nous vous confirmons le rendez-vous.</p>}>
      <form
        class="at-form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void state.send();
        }}
      >
        <Show when={props.introduction}>{(introduction) => <p>{introduction()}</p>}</Show>
        <FormField label="Jour" error={undefined}>
          <input class="at-input" type="date" onInput={(event) => void state.chooseDay(event.currentTarget.value)} />
        </FormField>
        <Show when={state.chosenDay()}>
          <FormField label="Créneau" error={errorsByField().slotId}>
            <Show when={state.availableSlotsStatus() === 'listed'} fallback={<p>{state.availableSlotsStatus() === 'failed' ? 'Créneaux indisponibles.' : '…'}</p>}>
              <select class="at-input" value={form.slotId} onChange={(event) => updateField('slotId', event.currentTarget.value)}>
                <option value="">—</option>
                <For each={state.availableSlots()}>{(slot) => <option value={slot.slotId}>{formatSlotTime(slot.startsAt)}</option>}</For>
              </select>
            </Show>
          </FormField>
        </Show>
        <FormField label="Prénom" error={errorsByField().firstName}>
          <input class="at-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errorsByField().lastName}>
          <input class="at-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errorsByField().phone}>
          <input class="at-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Motif" error={errorsByField().reason}>
          <input class="at-input" value={form.reason} onInput={(event) => updateField('reason', event.currentTarget.value)} />
        </FormField>
        <Show when={state.status() === 'slotTaken'}>
          <p role="alert">Créneau déjà pris : choisissez-en un autre.</p>
        </Show>
        <Show when={state.status() === 'failed'}>
          <p role="alert">Échec de l'envoi : réessayez ou appelez-nous.</p>
        </Show>
        <button class="at-button" type="submit" disabled={state.status() === 'sending'}>
          Demander
        </button>
      </form>
    </Show>
  );
}

function formatSlotTime(startsAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(startsAt));
}
