import { For, Show } from 'solid-js';
import { createAppointmentFormState, type AppointmentModuleProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { SectionHeading } from '../atoms/SectionHeading';
import { FormField } from '../molecules/FormField';

type BuiltInAppointmentProps = Extract<AppointmentModuleProps, { mode: 'builtIn' }>;

const defaultIntroduction = 'Choisissez un jour puis un créneau : nous vous confirmons le rendez-vous.';

export function AppointmentSection(props: AppointmentModuleProps) {
  return (
    <section class="nb-section nb-appointment" id="rendez-vous">
      <SectionHeading eyebrow="Prenez votre temps" title="Prendre rendez-vous" />
      {props.mode === 'externalLink' ? (
        <ButtonLink href={props.appointmentPath} variant="primary">
          Prendre rendez-vous
        </ButtonLink>
      ) : (
        <AppointmentBooking {...props} />
      )}
    </section>
  );
}

function AppointmentBooking(props: BuiltInAppointmentProps) {
  const state = createAppointmentFormState(props);
  const { form, updateField, errorsByField } = state;

  return (
    <Show
      when={state.status() !== 'requested'}
      fallback={<p class="nb-appointment__confirmation">Demande envoyée, merci ! La pharmacie vous confirme le rendez-vous.</p>}
    >
      <form
        class="nb-appointment__form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void state.send();
        }}
      >
        <p>{props.introduction ?? defaultIntroduction}</p>
        <FormField label="Jour" error={undefined}>
          <input class="nb-input" type="date" onInput={(event) => void state.chooseDay(event.currentTarget.value)} />
        </FormField>
        <Show when={state.chosenDay()}>
          <FormField label="Créneau" error={errorsByField().slotId}>
            <Show when={state.availableSlotsStatus() !== 'loading'} fallback={<p>Recherche des créneaux…</p>}>
              <Show when={state.availableSlotsStatus() !== 'failed'} fallback={<p role="alert">Impossible de charger les créneaux, réessayez.</p>}>
                <Show when={state.availableSlots().length > 0} fallback={<p>Aucun créneau ce jour-là.</p>}>
                  <select class="nb-input" value={form.slotId} onChange={(event) => updateField('slotId', event.currentTarget.value)}>
                    <option value="">Choisir…</option>
                    <For each={state.availableSlots()}>
                      {(slot) => <option value={slot.slotId}>{formatSlotTime(slot.startsAt)}</option>}
                    </For>
                  </select>
                </Show>
              </Show>
            </Show>
          </FormField>
        </Show>
        <FormField label="Prénom" error={errorsByField().firstName}>
          <input class="nb-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Nom" error={errorsByField().lastName}>
          <input class="nb-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
        </FormField>
        <FormField label="Téléphone" error={errorsByField().phone}>
          <input class="nb-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
        </FormField>
        <FormField label="Motif" error={errorsByField().reason}>
          <input class="nb-input" value={form.reason} onInput={(event) => updateField('reason', event.currentTarget.value)} />
        </FormField>
        <Show when={state.status() === 'slotTaken'}>
          <p role="alert">Ce créneau vient d'être pris : choisissez-en un autre.</p>
        </Show>
        <Show when={state.status() === 'failed'}>
          <p role="alert">L'envoi a échoué, réessayez ou appelez-nous.</p>
        </Show>
        <button class="nb-button nb-button--primary" type="submit" disabled={state.status() === 'sending'}>
          Demander ce rendez-vous
        </button>
      </form>
    </Show>
  );
}

/** Le créneau est affiché à l'heure de la pharmacie, comme le reste du site. */
function formatSlotTime(startsAt: string): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }).format(new Date(startsAt));
}
