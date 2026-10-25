import { createSignal, Match, Show, Switch } from 'solid-js';
import { createPrescriptionFormState, type PrescriptionForm, type PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormField } from '../molecules/FormField';
import { StepIndicator } from '../molecules/StepIndicator';
import { CounterTimeSaversStep } from './CounterTimeSaversStep';

type Step = { title: string; fields: ReadonlyArray<keyof PrescriptionForm> };

const aboutYouStep: Step = { title: 'Vous', fields: ['firstName', 'lastName', 'birthDate', 'phone'] };
const prescriptionStep: Step = { title: "L'ordonnance", fields: ['prescriptionFile', 'plannedVisitAt', 'hasAlreadyVisited'] };
const counterTimeSaversStep: Step = {
  title: 'Au comptoir',
  fields: ['socialSecurityNumber', 'vitalCardPhoto', 'mutualCardFront', 'mutualCardBack'],
};

/** Formulaire par étapes : on ne passe à l'étape suivante que si les champs de l'étape courante sont valides. */
export function PrescriptionSteps(props: PrescriptionUploadModuleProps) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;
  const [stepIndex, setStepIndex] = createSignal(0);

  /** Un client déjà venu saute l'étape carte Vitale et mutuelle : la pharmacie les a déjà. */
  const steps = (): ReadonlyArray<Step> =>
    form.hasAlreadyVisited ? [aboutYouStep, prescriptionStep] : [aboutYouStep, prescriptionStep, counterTimeSaversStep];
  const isLastStep = () => stepIndex() === steps().length - 1;

  async function send() {
    const errors = await state.send();
    const firstInvalidStepIndex = steps().findIndex((step) => step.fields.some((fieldName) => errors[fieldName] !== undefined));
    if (firstInvalidStepIndex >= 0) setStepIndex(firstInvalidStepIndex);
  }

  return (
    <section class="at-section at-prescription">
      <SectionTitle>Ordonnance</SectionTitle>
      <div class="at-section__content">
        <Show
          when={status() !== 'sent'}
          fallback={
            <p class="at-prescription__sent" role="status">
              Reçue. Nous préparons votre commande et vous appelons dès qu'elle est prête.
            </p>
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
                </div>
              </Match>
              <Match when={stepIndex() === 1}>
                <div class="at-steps__step">
                  <FormField label="Photo ou PDF de l'ordonnance" error={errorsByField().prescriptionFile}>
                    <span class="at-file">
                      <input
                        class="at-file__input"
                        type="file"
                        accept="image/*,application/pdf"
                        onInput={(event) => updateField('prescriptionFile', event.currentTarget.files?.[0])}
                      />
                      <span class="at-file__label">{form.prescriptionFile?.name ?? 'Choisir un fichier'}</span>
                    </span>
                  </FormField>
                  <FormField label="Heure de passage prévue" error={errorsByField().plannedVisitAt}>
                    <input
                      class="at-input"
                      type="datetime-local"
                      value={form.plannedVisitAt}
                      onInput={(event) => updateField('plannedVisitAt', event.currentTarget.value)}
                    />
                  </FormField>
                  <label class="at-checkbox">
                    <input type="checkbox" checked={form.hasAlreadyVisited} onChange={(event) => updateField('hasAlreadyVisited', event.currentTarget.checked)} />
                    <span>Je suis déjà venu dans cette pharmacie</span>
                  </label>
                </div>
              </Match>
              <Match when={stepIndex() === 2}>
                <CounterTimeSaversStep state={state} />
              </Match>
            </Switch>
            <Show when={isLastStep()}>
              <dl class="at-summary">
                <dt>Nom</dt>
                <dd>
                  {form.firstName} {form.lastName}
                </dd>
                <dt>Ordonnance</dt>
                <dd>{form.prescriptionFile?.name}</dd>
              </dl>
            </Show>
            <div class="at-steps__actions">
              <Show when={stepIndex() > 0}>
                <button class="at-button at-button--ghost" type="button" onClick={() => setStepIndex(stepIndex() - 1)}>
                  ← Précédent
                </button>
              </Show>
              <button class="at-button" type="submit" disabled={status() === 'sending'}>
                {!isLastStep() ? 'Suivant →' : status() === 'sending' ? 'Envoi…' : 'Envoyer'}
              </button>
            </div>
            <Show when={status() === 'failed'}>
              <p class="at-prescription__failure" role="alert">
                L'envoi a échoué. Réessayez, ou appelez la pharmacie.
              </p>
            </Show>
          </form>
        </Show>
      </div>
    </section>
  );
}
