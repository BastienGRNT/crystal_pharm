import { createSignal, Match, Show, Switch } from 'solid-js';
import type { PrescriptionForm, PrescriptionFormErrors, PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { FormField } from '../molecules/FormField';
import { StepIndicator } from '../molecules/StepIndicator';

const steps: ReadonlyArray<{ title: string; fields: ReadonlyArray<keyof PrescriptionForm> }> = [
  { title: 'Vous', fields: ['firstName', 'lastName'] },
  { title: "L'ordonnance", fields: ['file'] },
  { title: 'Vous joindre', fields: ['phone'] },
];
const lastStepIndex = steps.length - 1;

/** Formulaire par étapes : on ne passe à l'étape suivante que si les champs de l'étape courante sont valides. */
export function PrescriptionSteps(props: PrescriptionUploadModuleProps) {
  const [stepIndex, setStepIndex] = createSignal(0);
  const [firstName, setFirstName] = createSignal('');
  const [lastName, setLastName] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [file, setFile] = createSignal<File>();
  const [errorsByField, setErrorsByField] = createSignal<PrescriptionFormErrors>({});
  const [status, setStatus] = createSignal<'editing' | 'sending' | 'sent' | 'failed'>('editing');

  const form = (): PrescriptionForm => ({ firstName: firstName(), lastName: lastName(), phone: phone(), file: file() });

  function goToNextStep() {
    const allErrors = props.validatePrescription(form());
    const currentStepFields = steps[stepIndex()]?.fields ?? [];
    const currentStepErrors = Object.fromEntries(currentStepFields.map((fieldName) => [fieldName, allErrors[fieldName]]));
    setErrorsByField(currentStepErrors);
    if (currentStepFields.every((fieldName) => allErrors[fieldName] === undefined)) setStepIndex(stepIndex() + 1);
  }

  async function send() {
    setStatus('sending');
    const result = await props.submitPrescription(form());
    if (result.outcome === 'invalid') {
      setErrorsByField(result.errorsByField);
      const firstInvalidStepIndex = steps.findIndex((step) => step.fields.some((fieldName) => result.errorsByField[fieldName] !== undefined));
      setStepIndex(Math.max(firstInvalidStepIndex, 0));
      setStatus('editing');
      return;
    }
    setStatus(result.outcome);
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
            {props.introduction ?? 'Trois étapes, une minute : votre commande vous attend au comptoir.'}
          </p>
          <StepIndicator stepTitles={steps.map((step) => step.title)} currentStepIndex={stepIndex()} />
          <form
            class="at-steps"
            novalidate
            onSubmit={(event) => {
              event.preventDefault();
              if (stepIndex() < lastStepIndex) goToNextStep();
              else void send();
            }}
          >
            <Switch>
              <Match when={stepIndex() === 0}>
                <div class="at-steps__step">
                  <FormField label="Prénom" error={errorsByField().firstName}>
                    <input class="at-input" autocomplete="given-name" value={firstName()} onInput={(event) => setFirstName(event.currentTarget.value)} />
                  </FormField>
                  <FormField label="Nom" error={errorsByField().lastName}>
                    <input class="at-input" autocomplete="family-name" value={lastName()} onInput={(event) => setLastName(event.currentTarget.value)} />
                  </FormField>
                </div>
              </Match>
              <Match when={stepIndex() === 1}>
                <div class="at-steps__step">
                  <FormField label="Photo ou PDF de l'ordonnance" error={errorsByField().file}>
                    <span class="at-file">
                      <input class="at-file__input" type="file" accept="image/*,application/pdf" onInput={(event) => setFile(event.currentTarget.files?.[0])} />
                      <span class="at-file__label">{file()?.name ?? 'Choisir un fichier'}</span>
                    </span>
                  </FormField>
                </div>
              </Match>
              <Match when={stepIndex() === 2}>
                <div class="at-steps__step">
                  <FormField label="Téléphone" error={errorsByField().phone}>
                    <input class="at-input" type="tel" autocomplete="tel" value={phone()} onInput={(event) => setPhone(event.currentTarget.value)} />
                  </FormField>
                  <dl class="at-summary">
                    <dt>Nom</dt>
                    <dd>
                      {firstName()} {lastName()}
                    </dd>
                    <dt>Ordonnance</dt>
                    <dd>{file()?.name}</dd>
                  </dl>
                </div>
              </Match>
            </Switch>
            <div class="at-steps__actions">
              <Show when={stepIndex() > 0}>
                <button class="at-button at-button--ghost" type="button" onClick={() => setStepIndex(stepIndex() - 1)}>
                  ← Précédent
                </button>
              </Show>
              <button class="at-button" type="submit" disabled={status() === 'sending'}>
                {stepIndex() < lastStepIndex ? 'Suivant →' : status() === 'sending' ? 'Envoi…' : 'Envoyer'}
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
