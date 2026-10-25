import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

const imageOrPdf = 'image/*,application/pdf';

/** Carte Vitale et mutuelle : facultatives, mais c'est autant de temps gagné au comptoir. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;

  return (
    <fieldset class="essential-form__group essential-form__group--wide">
      <legend class="essential-form__group-title">Facultatif · gain de temps au comptoir</legend>
      <p class="essential-form__note">Ajoutées maintenant, ces informations ne vous seront pas redemandées à votre arrivée.</p>
      <div class="essential-choice" role="group" aria-label="Comment nous donner votre carte Vitale">
        <button type="button" aria-pressed={vitalCardMode() === 'photo'} onClick={() => setVitalCardMode('photo')}>
          Carte Vitale en photo
        </button>
        <button type="button" aria-pressed={vitalCardMode() === 'number'} onClick={() => setVitalCardMode('number')}>
          Carte Vitale par numéro
        </button>
      </div>
      <Show
        when={vitalCardMode() === 'number'}
        fallback={
          <FormField label="Photo de la carte Vitale" error={errorsByField().vitalCardPhoto}>
            <input class="essential-input" type="file" accept={imageOrPdf} onInput={(event) => updateField('vitalCardPhoto', event.currentTarget.files?.[0])} />
          </FormField>
        }
      >
        <FormField label="Numéro de sécurité sociale" hint="15 chiffres." error={errorsByField().socialSecurityNumber}>
          <input
            class="essential-input"
            inputmode="numeric"
            autocomplete="off"
            value={form.socialSecurityNumber}
            onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)}
          />
        </FormField>
      </Show>
      <FormField label="Mutuelle" hint="Un PDF, ou vos photos : choisissez le recto et le verso en une fois." error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
        <input class="essential-input" type="file" accept={imageOrPdf} multiple onInput={(event) => setMutualCardFiles(Array.from(event.currentTarget.files ?? []))} />
      </FormField>
    </fieldset>
  );
}
