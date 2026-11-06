import { PrescriptionNoteMaximumLength } from '@crystal-pharm/schema';
import { createSignal, onMount, Show } from 'solid-js';
import {
  createPrescriptionFormState,
  forgetPatient,
  readRememberedPatient,
  rememberPatient,
  type PrescriptionUploadModuleProps,
} from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';
import { PlannedVisitChoices } from '../molecules/PlannedVisitChoices';
import { PrescriptionPagesList } from '../molecules/PrescriptionPagesList';
import { CounterTimeSavers } from './CounterTimeSavers';

/** Formulaire classique : tous les champs visibles en même temps. */
export function PrescriptionForm(props: Pick<PrescriptionUploadModuleProps, 'submitPrescription' | 'validatePrescription'>) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;
  const [isRemembered, setIsRemembered] = createSignal(false);

  onMount(() => {
    const rememberedPatient = readRememberedPatient();
    if (!rememberedPatient) return;
    state.prefill(rememberedPatient);
    setIsRemembered(true);
  });

  async function send(): Promise<void> {
    await state.send();
    if (status() !== 'sent') return;
    if (isRemembered()) {
      rememberPatient({ firstName: form.firstName, lastName: form.lastName, birthDate: form.birthDate, phone: form.phone, email: form.email });
    } else {
      forgetPatient();
    }
  }

  return (
    <Show
      when={status() !== 'sent'}
      fallback={
        <div class="essential-form__sent" role="status">
          <p class="essential-form__sent-title">■ Ordonnance envoyée.</p>
          <p>
            {form.email ? `Un email part à ${form.email} dès que c'est prêt.` : `Nous vous appelons au ${form.phone} si nous avons une question.`}
          </p>
          <p>À apporter : l'ordonnance originale, en papier ; votre carte Vitale.</p>
        </div>
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
          <legend class="essential-form__group-title">1 · Ordonnance</legend>
          <PrescriptionPagesList pages={state.prescriptionPages()} error={errorsByField().prescriptionFile ?? errorsByField().additionalPrescriptionPages} onChange={state.setPrescriptionPages} />
          <label class="essential-checkbox">
            <input type="checkbox" checked={form.isRenewal} onChange={(event) => updateField('isRenewal', event.currentTarget.checked)} />
            <span>C'est un renouvellement</span>
          </label>
          <PlannedVisitChoices value={form.plannedVisitAt} error={errorsByField().plannedVisitAt} onChange={(value) => updateField('plannedVisitAt', value)} />
        </fieldset>
        <fieldset class="essential-form__group">
          <legend class="essential-form__group-title">2 · Patient</legend>
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="essential-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="essential-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Date de naissance" error={errorsByField().birthDate}>
            <input class="essential-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
          </FormField>
        </fieldset>
        <fieldset class="essential-form__group">
          <legend class="essential-form__group-title">3 · Contact</legend>
          <FormField label="Téléphone" error={errorsByField().phone}>
            <input class="essential-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
          </FormField>
          <FormField label="Email" hint="Prévenu quand c'est prêt." error={errorsByField().email}>
            <input class="essential-input" type="email" autocomplete="email" value={form.email} onInput={(event) => updateField('email', event.currentTarget.value)} />
          </FormField>
          <FormField label="Un mot pour l'équipe (facultatif)" error={errorsByField().noteFromPatient}>
            <textarea class="essential-input" rows="2" maxlength={PrescriptionNoteMaximumLength} value={form.noteFromPatient} onInput={(event) => updateField('noteFromPatient', event.currentTarget.value)} />
          </FormField>
        </fieldset>
        <div class="essential-form__group essential-form__group--wide essential-form__checks">
          <label class="essential-checkbox">
            <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
            <span>Je suis déjà client : vous avez ma carte Vitale et ma mutuelle</span>
          </label>
          <label class="essential-checkbox">
            <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
            <span>Retenir mes coordonnées sur cet appareil (pas sur un ordinateur partagé)</span>
          </label>
        </div>
        <Show when={!form.hasAlreadyVisited}>
          <CounterTimeSavers state={state} />
        </Show>
        <button class="essential-form__submit" type="submit" disabled={status() === 'sending'}>
          {status() === 'sending' ? 'Envoi en cours…' : '→ Envoyer mon ordonnance'}
        </button>
        <Show when={status() === 'failed'}>
          <p class="essential-form__status" role="alert">
            L'envoi a échoué. Réessayez, ou appelez directement la pharmacie.
          </p>
        </Show>
        <p class="essential-form__note essential-form__group--wide">Transmis chiffré, chez un hébergeur agréé données de santé, effacé après votre passage.</p>
      </form>
    </Show>
  );
}
