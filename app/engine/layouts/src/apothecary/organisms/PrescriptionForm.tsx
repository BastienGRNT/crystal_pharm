import { PrescriptionNoteMaximumLength } from '@crystal-pharm/schema';
import { createSignal, For, onMount, Show } from 'solid-js';
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

const stepTitles = ['L\'ordonnance', 'Le patient', 'Pour vous joindre'];
const fieldsByStep: string[][] = [
  ['prescriptionFile', 'additionalPrescriptionPages', 'plannedVisitAt'],
  ['firstName', 'lastName', 'birthDate'],
  ['phone', 'email', 'noteFromPatient'],
];
const lastStepIndex = stepTitles.length - 1;

/** Trois pleines pages à tourner une à une : l'ordonnance, le patient, le contact. */
export function PrescriptionForm(props: Pick<PrescriptionUploadModuleProps, 'submitPrescription' | 'validatePrescription'>) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;
  const [isRemembered, setIsRemembered] = createSignal(false);
  const [stepIndex, setStepIndex] = createSignal(0);

  onMount(() => {
    const rememberedPatient = readRememberedPatient();
    if (!rememberedPatient) return;
    state.prefill(rememberedPatient);
    setIsRemembered(true);
  });

  function goToFirstStepWithError(): void {
    const errors = errorsByField();
    const firstStepWithError = fieldsByStep.findIndex((fields) => fields.some((field) => errors[field as keyof typeof errors]));
    if (firstStepWithError >= 0) setStepIndex(firstStepWithError);
  }

  async function send(): Promise<void> {
    await state.send();
    if (status() !== 'sent') {
      goToFirstStepWithError();
      return;
    }
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
        <div class="ap-pages__sent" role="status">
          <p class="ap-pages__sent-title">Ordonnance envoyée.</p>
          <p>{form.email ? `Un email part à ${form.email} dès que c'est prêt.` : `Nous vous appelons au ${form.phone} si nous avons une question.`}</p>
          <p>À apporter : l'ordonnance originale, en papier, et votre carte Vitale.</p>
        </div>
      }
    >
      <form
        class="ap-pages"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          if (stepIndex() < lastStepIndex) {
            setStepIndex(stepIndex() + 1);
            return;
          }
          void send();
        }}
      >
        <ol class="ap-pages__progress" aria-label="Étapes de l'envoi">
          <For each={stepTitles}>
            {(title, index) => (
              <li class="ap-pages__progress-item" classList={{ 'ap-pages__progress-item--current': index() === stepIndex(), 'ap-pages__progress-item--done': index() < stepIndex() }} aria-current={index() === stepIndex() ? 'step' : undefined}>
                <span class="ap-pages__progress-number">{['I', 'II', 'III'][index()]}</span>
                <span>{title}</span>
              </li>
            )}
          </For>
        </ol>

        <div class="ap-pages__page" hidden={stepIndex() !== 0}>
          <h3 class="ap-pages__title">{stepTitles[0]}</h3>
          <PrescriptionPagesList pages={state.prescriptionPages()} error={errorsByField().prescriptionFile ?? errorsByField().additionalPrescriptionPages} onChange={state.setPrescriptionPages} />
          <label class="ap-checkbox">
            <input type="checkbox" checked={form.isRenewal} onChange={(event) => updateField('isRenewal', event.currentTarget.checked)} />
            <span>C'est un renouvellement</span>
          </label>
          <PlannedVisitChoices value={form.plannedVisitAt} error={errorsByField().plannedVisitAt} onChange={(value) => updateField('plannedVisitAt', value)} />
        </div>

        <div class="ap-pages__page" hidden={stepIndex() !== 1}>
          <h3 class="ap-pages__title">{stepTitles[1]}</h3>
          <FormField label="Prénom" error={errorsByField().firstName}>
            <input class="ap-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Nom" error={errorsByField().lastName}>
            <input class="ap-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
          </FormField>
          <FormField label="Date de naissance" error={errorsByField().birthDate}>
            <input class="ap-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
          </FormField>
          <label class="ap-checkbox">
            <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
            <span>Je suis déjà venu : vous avez ma carte Vitale et ma mutuelle</span>
          </label>
        </div>

        <div class="ap-pages__page" hidden={stepIndex() !== 2}>
          <h3 class="ap-pages__title">{stepTitles[2]}</h3>
          <FormField label="Téléphone" error={errorsByField().phone}>
            <input class="ap-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
          </FormField>
          <FormField label="Email (facultatif)" hint="C'est par lui que nous vous prévenons quand c'est prêt." error={errorsByField().email}>
            <input class="ap-input" type="email" autocomplete="email" value={form.email} onInput={(event) => updateField('email', event.currentTarget.value)} />
          </FormField>
          <FormField label="Un mot pour l'équipe (facultatif)" error={errorsByField().noteFromPatient}>
            <textarea class="ap-input" rows="2" maxlength={PrescriptionNoteMaximumLength} value={form.noteFromPatient} onInput={(event) => updateField('noteFromPatient', event.currentTarget.value)} />
          </FormField>
          <label class="ap-checkbox">
            <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
            <span>Retenir mes coordonnées sur cet appareil (pas sur un ordinateur partagé)</span>
          </label>
          <Show when={!form.hasAlreadyVisited}>
            <CounterTimeSavers state={state} />
          </Show>
          <p class="ap-pages__note">Transmis chiffré, chez un hébergeur agréé données de santé, effacé après votre passage.</p>
        </div>

        <div class="ap-pages__navigation">
          <Show when={stepIndex() > 0}>
            <button class="ap-pages__back" type="button" onClick={() => setStepIndex(stepIndex() - 1)}>
              Retour
            </button>
          </Show>
          <button class="ap-pages__next" type="submit" disabled={status() === 'sending'}>
            {stepIndex() < lastStepIndex ? 'Continuer' : status() === 'sending' ? 'Envoi en cours…' : 'Envoyer mon ordonnance'}
          </button>
        </div>
        <Show when={status() === 'failed'}>
          <p class="ap-pages__status" role="alert">
            L'envoi a échoué. Réessayez, ou appelez directement la pharmacie.
          </p>
        </Show>
      </form>
    </Show>
  );
}
