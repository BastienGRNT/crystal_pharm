import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormErrors, SubmitPrescription } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

/** Formulaire classique sur une seule page. */
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
          void send();
        }}
      >
        <div class="nb-form__row">
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="nb-input" autocomplete="given-name" value={firstName()} onInput={(event) => setFirstName(event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="nb-input" autocomplete="family-name" value={lastName()} onInput={(event) => setLastName(event.currentTarget.value)} />
          </FormField>
        </div>
        <FormField label="Téléphone" hint="Pour vous prévenir quand votre commande est prête." error={errorsByField().phone}>
          <input class="nb-input" type="tel" autocomplete="tel" value={phone()} onInput={(event) => setPhone(event.currentTarget.value)} />
        </FormField>
        <FormField label="Votre ordonnance" error={errorsByField().file}>
          <span class="nb-dropzone">
            <input class="nb-dropzone__input" type="file" accept="image/*,application/pdf" onInput={(event) => setFile(event.currentTarget.files?.[0])} />
            <span class="nb-dropzone__text">{file()?.name ?? 'Choisir une photo ou un PDF'}</span>
          </span>
        </FormField>
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
