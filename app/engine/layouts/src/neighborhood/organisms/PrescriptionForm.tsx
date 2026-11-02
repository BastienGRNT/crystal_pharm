import { PrescriptionNoteMaximumLength } from '@crystal-pharm/schema';
import { createSignal, onMount, Show } from 'solid-js';
import {
  createPrescriptionFormState,
  forgetPatient,
  readRememberedPatient,
  rememberPatient,
  type PrescriptionUploadModuleProps,
} from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { BirthDateFields } from '../molecules/BirthDateFields';
import { CheckboxLine } from '../molecules/CheckboxLine';
import { FormField } from '../molecules/FormField';
import { FormStep } from '../molecules/FormStep';
import { PlannedVisitPicker } from '../molecules/PlannedVisitPicker';
import { PrescriptionPagesPicker } from '../molecules/PrescriptionPagesPicker';
import { CounterTimeSavers } from './CounterTimeSavers';
import { PrescriptionSent } from './PrescriptionSent';

/** Tout sur une page, en quatre questions numérotées : on voit d'emblée ce qui est demandé, et rien n'est caché derrière un « suivant ». */
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
    <Show when={status() !== 'sent'} fallback={<PrescriptionSent form={form} />}>
      <form
        class="nb-form"
        novalidate
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <FormStep number={1} title="Votre ordonnance">
          <PrescriptionPagesPicker pages={state.prescriptionPages()} error={errorsByField().prescriptionFile ?? errorsByField().additionalPrescriptionPages} onChange={state.setPrescriptionPages} />
          <CheckboxLine checked={form.isRenewal} onChange={(checked) => updateField('isRenewal', checked)} hint="Votre traitement habituel, déjà délivré ici.">
            C’est un renouvellement
          </CheckboxLine>
        </FormStep>

        <FormStep number={2} title="Pour qui ?" hint="La personne dont le nom est sur l’ordonnance : vous pouvez l’envoyer pour un proche.">
          <div class="nb-form__row">
            <FormField label="Prénom" error={errorsByField().firstName}>
              <input class="nb-input" autocomplete="given-name" value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
            </FormField>
            <FormField label="Nom" error={errorsByField().lastName}>
              <input class="nb-input" autocomplete="family-name" value={form.lastName} onInput={(event) => updateField('lastName', event.currentTarget.value)} />
            </FormField>
          </div>
          <BirthDateFields value={form.birthDate} error={errorsByField().birthDate} onChange={(value) => updateField('birthDate', value)} />
        </FormStep>

        <FormStep number={3} title="Comment vous joindre ?">
          <div class="nb-form__row">
            <FormField label="Téléphone" hint="Si nous avons une question." error={errorsByField().phone}>
              <input class="nb-input" type="tel" autocomplete="tel" value={form.phone} onInput={(event) => updateField('phone', event.currentTarget.value)} />
            </FormField>
            <FormField label="Email" hint="Pour être prévenu quand c’est prêt." error={errorsByField().email}>
              <input class="nb-input" type="email" autocomplete="email" value={form.email} onInput={(event) => updateField('email', event.currentTarget.value)} />
            </FormField>
          </div>
        </FormStep>

        <FormStep number={4} title="Quand passez-vous ?">
          <PlannedVisitPicker value={form.plannedVisitAt} error={errorsByField().plannedVisitAt} onChange={(value) => updateField('plannedVisitAt', value)} />
          <FormField label="Un mot pour l’équipe" optional hint="Par exemple : « je préfère les génériques »." error={errorsByField().noteFromPatient}>
            <textarea
              class="nb-input"
              rows="2"
              maxlength={PrescriptionNoteMaximumLength}
              value={form.noteFromPatient}
              onInput={(event) => updateField('noteFromPatient', event.currentTarget.value)}
            />
          </FormField>
        </FormStep>

        <div class="nb-form__extras">
          <CheckboxLine checked={form.hasAlreadyVisited} onChange={(checked) => updateField('hasAlreadyVisited', checked)} hint="Nous avons déjà votre carte Vitale et votre mutuelle.">
            Je suis déjà client de la pharmacie
          </CheckboxLine>
          <Show when={!form.hasAlreadyVisited}>
            <CounterTimeSavers state={state} />
          </Show>
          <CheckboxLine checked={isRemembered()} onChange={setIsRemembered} hint="À éviter sur un ordinateur partagé. Vos documents, eux, ne sont jamais gardés ici.">
            Retenir mes coordonnées sur cet appareil
          </CheckboxLine>
        </div>

        <div class="nb-form__send">
          <button class="nb-button nb-button--primary nb-button--large" type="submit" disabled={status() === 'sending'}>
            {status() === 'sending' ? 'Envoi en cours…' : 'Envoyer mon ordonnance'}
          </button>
          <Show when={status() === 'failed'}>
            <p class="nb-form__failure" role="alert">
              L’envoi n’a pas fonctionné. Réessayez dans un instant, ou appelez-nous.
            </p>
          </Show>
          <p class="nb-form__privacy">
            <Icon name="lock" />
            Transmis chiffré, hébergé chez un hébergeur agréé pour les données de santé, effacé après votre passage.
          </p>
        </div>
      </form>
    </Show>
  );
}
