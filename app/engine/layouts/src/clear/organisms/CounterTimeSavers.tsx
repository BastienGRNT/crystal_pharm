import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

const imageOrPdf = 'image/*,application/pdf';

/** Carte Vitale et mutuelle : deux lignes repliées, qui s'ouvrent seules si elles ont une erreur. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;
  const hasVitalCardError = () => Boolean(errorsByField().vitalCardPhoto ?? errorsByField().socialSecurityNumber);
  const hasMutualCardError = () => Boolean(errorsByField().mutualCardFront ?? errorsByField().mutualCardBack);

  return (
    <div class="cl-savers">
      <p class="cl-savers__intro">Facultatif, mais autant de temps gagné au comptoir : on ne vous le redemandera pas.</p>
      <details class="cl-savers__item" open={hasVitalCardError()}>
        <summary>Carte Vitale</summary>
        <div class="cl-savers__body">
          <div class="cl-savers__switch" role="group" aria-label="Comment nous donner votre carte Vitale">
            <button type="button" aria-pressed={vitalCardMode() === 'photo'} onClick={() => setVitalCardMode('photo')}>
              En photo
            </button>
            <button type="button" aria-pressed={vitalCardMode() === 'number'} onClick={() => setVitalCardMode('number')}>
              Par son numéro
            </button>
          </div>
          <Show
            when={vitalCardMode() === 'number'}
            fallback={
              <FormField label="Photo de la carte Vitale" error={errorsByField().vitalCardPhoto}>
                <input class="cl-input" type="file" accept={imageOrPdf} onInput={(event) => updateField('vitalCardPhoto', event.currentTarget.files?.[0])} />
              </FormField>
            }
          >
            <FormField label="Numéro de sécurité sociale" hint="15 chiffres." error={errorsByField().socialSecurityNumber}>
              <input class="cl-input" inputmode="numeric" autocomplete="off" value={form.socialSecurityNumber} onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)} />
            </FormField>
          </Show>
        </div>
      </details>
      <details class="cl-savers__item" open={hasMutualCardError()}>
        <summary>Mutuelle</summary>
        <div class="cl-savers__body">
          <FormField label="Votre carte de mutuelle" hint="Un PDF, ou vos photos : choisissez le recto et le verso en une fois." error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
            <input class="cl-input" type="file" accept={imageOrPdf} multiple onInput={(event) => setMutualCardFiles(Array.from(event.currentTarget.files ?? []))} />
          </FormField>
        </div>
      </details>
    </div>
  );
}
