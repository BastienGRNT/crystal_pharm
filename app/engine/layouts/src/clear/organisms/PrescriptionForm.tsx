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

/** Une seule fiche : chaque information sur sa ligne, libellé à gauche, champ à droite. */
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
        <div class="cl-sheet-sent" role="status">
          <p class="cl-sheet-sent-title">Ordonnance envoyée.</p>
          <p>{form.email ? `Un email part à ${form.email} dès que c'est prêt.` : `Nous vous appelons au ${form.phone} si nous avons une question.`}</p>
          <p>À apporter : l'ordonnance originale, en papier, et votre carte Vitale.</p>
        </div>
      }
    >
      <form
        class="cl-sheet"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div class="cl-sheet__row">
          <p class="cl-sheet__label">Ordonnance</p>
          <div class="cl-sheet__control">
            <PrescriptionPagesList pages={state.prescriptionPages()} error={errorsByField().prescriptionFile ?? errorsByField().additionalPrescriptionPages} onChange={state.setPrescriptionPages} />
            <label class="cl-checkbox">
              <input type="checkbox" checked={form.isRenewal} onChange={(event) => updateField('isRenewal', event.currentTarget.checked)} />
              <span>C'est un renouvellement</span>
            </label>
          </div>
        </div>
        <div class="cl-sheet__row">
          <p class="cl-sheet__label">Retrait</p>
          <div class="cl-sheet__control">
            <PlannedVisitChoices value={form.plannedVisitAt} error={errorsByField().plannedVisitAt} onChange={(value) => updateField('plannedVisitAt', value)} />
          </div>
        </div>
        <div class="cl-sheet__row">
          <p class="cl-sheet__label">Patient</p>
          <div class="cl-sheet__control cl-sheet__control--inline">
            <FormField label="Prénom" error={errorsByField().firstName}>
              <input class="cl-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
            </FormField>
            <FormField label="Nom" error={errorsByField().lastName}>
              <input class="cl-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
            </FormField>
            <FormField label="Date de naissance" error={errorsByField().birthDate}>
              <input class="cl-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
            </FormField>
          </div>
        </div>
        <div class="cl-sheet__row">
          <p class="cl-sheet__label">Contact</p>
          <div class="cl-sheet__control cl-sheet__control--inline">
            <FormField label="Téléphone" error={errorsByField().phone}>
              <input class="cl-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
            </FormField>
            <FormField label="Email" hint="Pour vous prévenir quand c'est prêt." error={errorsByField().email}>
              <input class="cl-input" type="email" autocomplete="email" value={form.email} onInput={(event) => updateField('email', event.currentTarget.value)} />
            </FormField>
          </div>
        </div>
        <div class="cl-sheet__row">
          <p class="cl-sheet__label">Message</p>
          <div class="cl-sheet__control">
            <FormField label="Un mot pour l'équipe (facultatif)" error={errorsByField().noteFromPatient}>
              <textarea class="cl-input" rows="2" maxlength={PrescriptionNoteMaximumLength} value={form.noteFromPatient} onInput={(event) => updateField('noteFromPatient', event.currentTarget.value)} />
            </FormField>
          </div>
        </div>
        <div class="cl-sheet__row">
          <p class="cl-sheet__label">Options</p>
          <div class="cl-sheet__control">
            <label class="cl-checkbox">
              <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
              <span>Je suis déjà venu : vous avez ma carte Vitale et ma mutuelle</span>
            </label>
            <label class="cl-checkbox">
              <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
              <span>Retenir mes coordonnées sur cet appareil (pas sur un ordinateur partagé)</span>
            </label>
          </div>
        </div>
        <Show when={!form.hasAlreadyVisited}>
          <div class="cl-sheet__row">
            <p class="cl-sheet__label">Gagner du temps</p>
            <div class="cl-sheet__control">
              <CounterTimeSavers state={state} />
            </div>
          </div>
        </Show>
        <div class="cl-sheet__footer">
          <p class="cl-sheet__note">Transmis chiffré, chez un hébergeur agréé données de santé, effacé après votre passage.</p>
          <button class="cl-sheet__submit" type="submit" disabled={status() === 'sending'}>
            {status() === 'sending' ? 'Envoi en cours…' : 'Envoyer mon ordonnance'}
          </button>
        </div>
        <Show when={status() === 'failed'}>
          <p class="cl-sheet__status" role="alert">
            L'envoi a échoué. Réessayez, ou appelez directement la pharmacie.
          </p>
        </Show>
      </form>
    </Show>
  );
}
