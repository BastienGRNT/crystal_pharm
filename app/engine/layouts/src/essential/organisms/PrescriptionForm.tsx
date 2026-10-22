import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormErrors, SubmitPrescription } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

/** Formulaire classique : tous les champs visibles en même temps. */
export function PrescriptionForm(props: { submitPrescription: SubmitPrescription }) {
  const [firstName, setFirstName] = createSignal('');
  const [lastName, setLastName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [file, setFile] = createSignal<File>();
  const [errorsByField, setErrorsByField] = createSignal<PrescriptionFormErrors>({});
  const [status, setStatus] = createSignal<'editing' | 'sending' | 'sent' | 'failed'>('editing');

  async function send() {
    setStatus('sending');
    const result = await props.submitPrescription({ firstName: firstName(), lastName: lastName(), phone: phone(), file: file() });
    setErrorsByField(result.outcome === 'invalid' ? result.errorsByField : {});
    setStatus(result.outcome === 'invalid' ? 'editing' : result.outcome);
  }

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
          void send();
        }}
      >
        <fieldset class="essential-form__group">
          <legend class="essential-form__group-title">Vous</legend>
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="essential-input" autocomplete="given-name" value={firstName()} onInput={(event) => setFirstName(event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="essential-input" autocomplete="family-name" value={lastName()} onInput={(event) => setLastName(event.currentTarget.value)} />
          </FormField>
          <FormField label="Téléphone" error={errorsByField().phone}>
            <input class="essential-input" type="tel" autocomplete="tel" value={phone()} onInput={(event) => setPhone(event.currentTarget.value)} />
          </FormField>
        </fieldset>
        <fieldset class="essential-form__group">
          <legend class="essential-form__group-title">Ordonnance</legend>
          <FormField label="Photo ou PDF" error={errorsByField().file}>
            <input class="essential-input" type="file" accept="image/*,application/pdf" onInput={(event) => setFile(event.currentTarget.files?.[0])} />
          </FormField>
        </fieldset>
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
