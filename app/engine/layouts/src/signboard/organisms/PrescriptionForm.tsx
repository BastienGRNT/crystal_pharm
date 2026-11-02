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

/** Une seule rangée pour l'essentiel ; le reste se déplie, et s'ouvre de lui-même s'il y a une erreur. */
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

  const hasErrorInDetails = () => Boolean(errorsByField().email ?? errorsByField().noteFromPatient ?? errorsByField().plannedVisitAt);

  return (
    <Show
      when={status() !== 'sent'}
      fallback={
        <div class="sb-strip__sent" role="status">
          <p class="sb-strip__sent-title">Ordonnance envoyée.</p>
          <p>{form.email ? `Un email part à ${form.email} dès que c'est prêt.` : `Nous vous appelons au ${form.phone} si nous avons une question.`}</p>
          <p>À apporter : l'ordonnance originale, en papier, et votre carte Vitale.</p>
        </div>
      }
    >
      <form
        class="sb-strip"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <div class="sb-strip__pages">
          <PrescriptionPagesList pages={state.prescriptionPages()} error={errorsByField().prescriptionFile ?? errorsByField().additionalPrescriptionPages} onChange={state.setPrescriptionPages} />
        </div>
        <div class="sb-strip__line">
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="sb-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="sb-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Naissance" error={errorsByField().birthDate}>
            <input class="sb-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
          </FormField>
          <FormField label="Téléphone" error={errorsByField().phone}>
            <input class="sb-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
          </FormField>
          <button class="sb-strip__submit" type="submit" disabled={status() === 'sending'}>
            {status() === 'sending' ? 'Envoi…' : 'Envoyer'}
          </button>
        </div>
        <Show when={status() === 'failed'}>
          <p class="sb-strip__status" role="alert">
            L'envoi a échoué. Réessayez, ou appelez directement la pharmacie.
          </p>
        </Show>
        <details class="sb-strip__more" open={hasErrorInDetails()}>
          <summary class="sb-strip__more-toggle">Préciser : retrait, email, message</summary>
          <div class="sb-strip__more-body">
            <PlannedVisitChoices value={form.plannedVisitAt} error={errorsByField().plannedVisitAt} onChange={(value) => updateField('plannedVisitAt', value)} />
            <FormField label="Email (facultatif)" hint="C'est par lui que nous vous prévenons quand c'est prêt." error={errorsByField().email}>
              <input class="sb-input" type="email" autocomplete="email" value={form.email} onInput={(event) => updateField('email', event.currentTarget.value)} />
            </FormField>
            <FormField label="Un mot pour l'équipe (facultatif)" error={errorsByField().noteFromPatient}>
              <textarea class="sb-input" rows="2" maxlength={PrescriptionNoteMaximumLength} value={form.noteFromPatient} onInput={(event) => updateField('noteFromPatient', event.currentTarget.value)} />
            </FormField>
            <label class="sb-checkbox">
              <input type="checkbox" checked={form.isRenewal} onChange={(event) => updateField('isRenewal', event.currentTarget.checked)} />
              <span>C'est un renouvellement</span>
            </label>
            <label class="sb-checkbox">
              <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
              <span>Je suis déjà venu : vous avez ma carte Vitale et ma mutuelle</span>
            </label>
            <label class="sb-checkbox">
              <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
              <span>Retenir mes coordonnées sur cet appareil (pas sur un ordinateur partagé)</span>
            </label>
            <Show when={!form.hasAlreadyVisited}>
              <CounterTimeSavers state={state} />
            </Show>
          </div>
        </details>
        <p class="sb-strip__note">Transmis chiffré, chez un hébergeur agréé données de santé, effacé après votre passage.</p>
      </form>
    </Show>
  );
}
