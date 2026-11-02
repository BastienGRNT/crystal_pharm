import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

const imageOrPdf = 'image/*,application/pdf';

/** Carte Vitale et mutuelle : deux tuiles numérotées, chacune avec son champ. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;

  return (
    <div class="sc-bonus">
      <p class="sc-bonus__intro">
        <strong>Un peu d'avance ?</strong> Facultatif : ce que vous ajoutez ici, on ne vous le redemande pas au comptoir.
      </p>
      <section class="sc-bonus__tile">
        <span class="sc-bonus__number" aria-hidden="true">
          1
        </span>
        <h4 class="sc-bonus__title">Carte Vitale</h4>
        <div class="sc-bonus__switch" role="group" aria-label="Comment nous donner votre carte Vitale">
          <button type="button" aria-pressed={vitalCardMode() === 'photo'} onClick={() => setVitalCardMode('photo')}>
            Photo
          </button>
          <button type="button" aria-pressed={vitalCardMode() === 'number'} onClick={() => setVitalCardMode('number')}>
            Numéro
          </button>
        </div>
        <Show
          when={vitalCardMode() === 'number'}
          fallback={
            <FormField label="Photo de la carte" error={errorsByField().vitalCardPhoto}>
              <input class="sc-input" type="file" accept={imageOrPdf} onInput={(event) => updateField('vitalCardPhoto', event.currentTarget.files?.[0])} />
            </FormField>
          }
        >
          <FormField label="Numéro de sécurité sociale" hint="15 chiffres." error={errorsByField().socialSecurityNumber}>
            <input class="sc-input" inputmode="numeric" autocomplete="off" value={form.socialSecurityNumber} onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)} />
          </FormField>
        </Show>
      </section>
      <section class="sc-bonus__tile">
        <span class="sc-bonus__number" aria-hidden="true">
          2
        </span>
        <h4 class="sc-bonus__title">Mutuelle</h4>
        <FormField label="Votre carte" hint="Un PDF, ou vos photos : le recto et le verso en une fois." error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
          <input class="sc-input" type="file" accept={imageOrPdf} multiple onInput={(event) => setMutualCardFiles(Array.from(event.currentTarget.files ?? []))} />
        </FormField>
      </section>
    </div>
  );
}
