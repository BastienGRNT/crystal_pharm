import { PrescriptionNoteMaximumLength } from '@crystal-pharm/schema';
import { createSignal, Match, onMount, Show, Switch } from 'solid-js';
import {
  createPrescriptionFormState,
  forgetPatient,
  readRememberedPatient,
  rememberPatient,
  type PrescriptionForm,
  type PrescriptionUploadModuleProps,
} from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormField } from '../molecules/FormField';
import { PlannedVisitChoices } from '../molecules/PlannedVisitChoices';
import { PrescriptionPagesList } from '../molecules/PrescriptionPagesList';
import { StepIndicator } from '../molecules/StepIndicator';
import { CounterTimeSaversStep } from './CounterTimeSaversStep';

type Step = { title: string; fields: ReadonlyArray<keyof PrescriptionForm> };

const prescriptionStep: Step = { title: "L'ordonnance", fields: ['prescriptionFile', 'additionalPrescriptionPages', 'isRenewal', 'plannedVisitAt', 'hasAlreadyVisited'] };
const aboutYouStep: Step = { title: 'Vous', fields: ['firstName', 'lastName', 'birthDate', 'phone', 'email', 'noteFromPatient'] };
const counterTimeSaversStep: Step = {
  title: 'Au comptoir',
  fields: ['socialSecurityNumber', 'vitalCardPhoto', 'mutualCardFront', 'mutualCardBack'],
};

/** Formulaire par étapes : on ne passe à l'étape suivante que si les champs de l'étape courante sont valides. */
export function PrescriptionSteps(props: PrescriptionUploadModuleProps) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;
  const [stepIndex, setStepIndex] = createSignal(0);
  const [isRemembered, setIsRemembered] = createSignal(false);

  onMount(() => {
    const rememberedPatient = readRememberedPatient();
    if (!rememberedPatient) return;
    state.prefill(rememberedPatient);
    setIsRemembered(true);
  });

  /** Un client déjà venu saute l'étape carte Vitale et mutuelle : la pharmacie les a déjà. */
  const steps = (): ReadonlyArray<Step> =>
    form.hasAlreadyVisited ? [prescriptionStep, aboutYouStep] : [prescriptionStep, aboutYouStep, counterTimeSaversStep];
  const isLastStep = () => stepIndex() === steps().length - 1;

  async function send() {
    const errors = await state.send();
    const firstInvalidStepIndex = steps().findIndex((step) => step.fields.some((fieldName) => errors[fieldName] !== undefined));
    if (firstInvalidStepIndex >= 0) setStepIndex(firstInvalidStepIndex);
    if (status() !== 'sent') return;
    if (isRemembered()) {
      rememberPatient({ firstName: form.firstName, lastName: form.lastName, birthDate: form.birthDate, phone: form.phone, email: form.email });
    } else {
      forgetPatient();
    }
  }

  return (
    <section class="at-section at-prescription">
      <SectionTitle>Ordonnance</SectionTitle>
      <div class="at-section__content">
        <Show
          when={status() !== 'sent'}
          fallback={
            <div class="at-prescription__sent" role="status">
              <p class="at-prescription__sent-title">Reçue, merci {form.firstName}.</p>
              <p>{form.email ? `Un email part à ${form.email} dès que c'est prêt.` : `Nous vous appelons au ${form.phone} si nous avons une question.`}</p>
              <p>À apporter : l'ordonnance originale, en papier, et votre carte Vitale.</p>
            </div>
          }
        >
          <p class="at-prescription__introduction">
            {props.introduction ?? 'Quelques étapes, une minute : votre commande vous attend au comptoir.'}
          </p>
          <StepIndicator stepTitles={steps().map((step) => step.title)} currentStepIndex={stepIndex()} />
          <form
            class="at-steps"
            novalidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!isLastStep()) {
                if (state.validateFields(steps()[stepIndex()]?.fields ?? [])) setStepIndex(stepIndex() + 1);
              } else void send();
            }}
          >
            <Switch>
              <Match when={stepIndex() === 0}>
                <div class="at-steps__step">
                  <PrescriptionPagesList
                    pages={state.prescriptionPages()}
                    error={errorsByField().prescriptionFile ?? errorsByField().additionalPrescriptionPages}
                    onChange={state.setPrescriptionPages}
                  />
                  <label class="at-checkbox">
                    <input type="checkbox" checked={form.isRenewal} onChange={(event) => updateField('isRenewal', event.currentTarget.checked)} />
                    <span>C'est un renouvellement</span>
                  </label>
                  <PlannedVisitChoices value={form.plannedVisitAt} error={errorsByField().plannedVisitAt} onChange={(value) => updateField('plannedVisitAt', value)} />
                  <label class="at-checkbox">
                    <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
                    <span>Je suis déjà client : vous avez ma carte Vitale et ma mutuelle</span>
                  </label>
                </div>
              </Match>
              <Match when={stepIndex() === 1}>
                <div class="at-steps__step">
                  <FormField label="Prénom" error={errorsByField().firstName}>
                    <input class="at-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
                  </FormField>
                  <FormField label="Nom" error={errorsByField().lastName}>
                    <input class="at-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
                  </FormField>
                  <FormField label="Date de naissance" error={errorsByField().birthDate}>
                    <input class="at-input" type="date" autocomplete="bday" value={form.birthDate} onInput={(event) => updateField('birthDate', event.currentTarget.value)} />
                  </FormField>
                  <FormField label="Téléphone" error={errorsByField().phone}>
                    <input class="at-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
                  </FormField>
                  <FormField label="Email" hint="Pour être prévenu quand c'est prêt." error={errorsByField().email}>
                    <input class="at-input" type="email" autocomplete="email" value={form.email} onInput={(event) => updateField('email', event.currentTarget.value)} />
                  </FormField>
                  <FormField label="Un mot pour l'équipe (facultatif)" error={errorsByField().noteFromPatient}>
                    <textarea class="at-input" rows="2" maxlength={PrescriptionNoteMaximumLength} value={form.noteFromPatient} onInput={(event) => updateField('noteFromPatient', event.currentTarget.value)} />
                  </FormField>
                </div>
              </Match>
              <Match when={stepIndex() === 2}>
                <CounterTimeSaversStep state={state} />
              </Match>
            </Switch>
            <Show when={isLastStep()}>
              <dl class="at-summary">
                <dt>Pour</dt>
                <dd>
                  {form.firstName} {form.lastName}
                </dd>
                <dt>Ordonnance</dt>
                <dd>{state.prescriptionPages().length > 1 ? `${state.prescriptionPages().length} pages` : '1 page'}</dd>
              </dl>
              <label class="at-checkbox">
                <input type="checkbox" checked={isRemembered()} onChange={(event) => setIsRemembered(event.currentTarget.checked)} />
                <span>Retenir mes coordonnées sur cet appareil (pas sur un ordinateur partagé)</span>
              </label>
            </Show>
            <div class="at-steps__actions">
              <Show when={stepIndex() > 0}>
                <button class="at-button at-button--ghost" type="button" onClick={() => setStepIndex(stepIndex() - 1)}>
                  ← Précédent
                </button>
              </Show>
              <button class="at-button" type="submit" disabled={status() === 'sending'}>
                {!isLastStep() ? 'Suivant →' : status() === 'sending' ? 'Envoi…' : 'Envoyer mon ordonnance'}
              </button>
            </div>
            <Show when={status() === 'failed'}>
              <p class="at-prescription__failure" role="alert">
                L'envoi a échoué. Réessayez, ou appelez la pharmacie.
              </p>
            </Show>
            <p class="at-prescription__privacy">Transmis chiffré, chez un hébergeur agréé données de santé, effacé après votre passage.</p>
          </form>
        </Show>
      </div>
    </section>
  );
}
