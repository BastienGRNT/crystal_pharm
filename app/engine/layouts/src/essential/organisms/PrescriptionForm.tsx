import { Show } from 'solid-js';
import { createPrescriptionFormState, type PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';
import { CounterTimeSavers } from './CounterTimeSavers';

/** Formulaire classique : tous les champs visibles en même temps. */
export function PrescriptionForm(props: Pick<PrescriptionUploadModuleProps, 'submitPrescription' | 'validatePrescription'>) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;

  return (
    <Show
      when={status() !== 'sent'}
      fallback={
        <p class="essential-form__status" role="status">
          Ordonnance envoyée. Nous vous appelons dès que votre commande est prête.
        </p>
      }
    >
      <form
        class="essential-form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void state.send();
        }}
      >
        <fieldset class="essential-form__group">
          <legend class="essential-form__group-title">Vous</legend>
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="essential-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="essential-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Date de naissance" error={errorsByField().birthDate}>
            <input class="essential-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
          </FormField>
          <FormField label="Téléphone" error={errorsByField().phone}>
            <input class="essential-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
          </FormField>
        </fieldset>
        <fieldset class="essential-form__group">
          <legend class="essential-form__group-title">Ordonnance</legend>
          <FormField label="Photo ou PDF" error={errorsByField().prescriptionFile}>
            <input
              class="essential-input"
              type="file"
              accept="image/*,application/pdf"
              onInput={(event) => updateField('prescriptionFile', event.currentTarget.files?.[0])}
            />
          </FormField>
          <FormField label="Heure de passage prévue" error={errorsByField().plannedVisitAt}>
            <input
              class="essential-input"
              type="datetime-local"
              value={form.plannedVisitAt}
              onInput={(event) => updateField('plannedVisitAt', event.currentTarget.value)}
            />
          </FormField>
          <label class="essential-checkbox">
            <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
            <span>Je suis déjà venu dans cette pharmacie</span>
          </label>
        </fieldset>
        <Show when={!form.hasAlreadyVisited}>
          <CounterTimeSavers state={state} />
        </Show>
        <button class="essential-form__submit" type="submit" disabled={status() === 'sending'}>
          {status() === 'sending' ? 'Envoi en cours…' : 'Envoyer mon ordonnance'}
        </button>
        <Show when={status() === 'failed'}>
          <p class="essential-form__status" role="alert">
            L'envoi a échoué. Réessayez, ou appelez directement la pharmacie.
          </p>
        </Show>
      </form>
    </Show>
  );
}
