import { Show } from 'solid-js';
import { createPrescriptionFormState, type PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { FileDropzone } from '../molecules/FileDropzone';
import { FormField } from '../molecules/FormField';
import { CounterTimeSavers } from './CounterTimeSavers';

/** Formulaire classique sur une seule page. */
export function PrescriptionForm(props: Pick<PrescriptionUploadModuleProps, 'submitPrescription' | 'validatePrescription'>) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;

  return (
    <Show
      when={status() !== 'sent'}
      fallback={
        <div class="nb-form-sent" role="status">
          <span class="nb-form-sent__check" aria-hidden="true">✓</span>
          <h2>Merci, c'est bien reçu !</h2>
          <p>Nous préparons votre commande et nous vous appelons dès qu'elle est prête.</p>
        </div>
      }
    >
      <form
        class="nb-form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void state.send();
        }}
      >
        <div class="nb-form__row">
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="nb-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="nb-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
          </FormField>
        </div>
        <div class="nb-form__row">
          <FormField label="Date de naissance" error={errorsByField().birthDate}>
            <input class="nb-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
          </FormField>
          <FormField label="Téléphone" hint="Pour vous prévenir quand votre commande est prête." error={errorsByField().phone}>
            <input class="nb-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
          </FormField>
        </div>
        <FormField label="Quand pensez-vous passer ?" hint="Nous préparons votre commande pour ce moment-là." error={errorsByField().plannedVisitAt}>
          <input
            class="nb-input"
            type="datetime-local"
            value={form.plannedVisitAt}
            onInput={(event) => updateField('plannedVisitAt', event.currentTarget.value)}
          />
        </FormField>
        <FormField label="Votre ordonnance" error={errorsByField().prescriptionFile}>
          <FileDropzone prompt="Choisir une photo ou un PDF" fileNames={form.prescriptionFile?.name ?? ''} onFiles={(files) => updateField('prescriptionFile', files[0])} />
        </FormField>
        <label class="nb-checkbox">
          <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
          <span>Je suis déjà venu dans cette pharmacie</span>
        </label>
        <Show when={!form.hasAlreadyVisited}>
          <CounterTimeSavers state={state} />
        </Show>
        <button class="nb-button nb-button--primary nb-form__submit" type="submit" disabled={status() === 'sending'}>
          {status() === 'sending' ? 'Envoi en cours…' : 'Envoyer mon ordonnance'}
        </button>
        <Show when={status() === 'failed'}>
          <p class="nb-form__failure" role="alert">
            L'envoi n'a pas fonctionné. Réessayez dans un instant, ou appelez-nous directement.
          </p>
        </Show>
      </form>
    </Show>
  );
}
