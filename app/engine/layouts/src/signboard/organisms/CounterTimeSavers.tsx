import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

const imageOrPdf = 'image/*,application/pdf';

/** Carte Vitale et mutuelle : deux interrupteurs. Le champ ne s'ouvre que si on l'allume. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [isVitalCardOn, setIsVitalCardOn] = createSignal(false);
  const [isMutualCardOn, setIsMutualCardOn] = createSignal(false);
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;

  return (
    <div class="sb-switches">
      <p class="sb-switches__intro">Facultatif : ce que vous ajoutez ici, on ne vous le redemande pas au comptoir.</p>
      <div class="sb-switches__row">
        <button type="button" class="sb-switches__switch" role="switch" aria-checked={isVitalCardOn()} onClick={() => setIsVitalCardOn(!isVitalCardOn())}>
          <span class="sb-switches__knob" aria-hidden="true" />
          Carte Vitale
        </button>
        <Show when={isVitalCardOn()}>
          <div class="sb-switches__content">
            <div class="sb-switches__modes" role="group" aria-label="Comment nous donner votre carte Vitale">
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
                  <input class="sb-input" type="file" accept={imageOrPdf} onInput={(event) => updateField('vitalCardPhoto', event.currentTarget.files?.[0])} />
                </FormField>
              }
            >
              <FormField label="Numéro de sécurité sociale" hint="15 chiffres." error={errorsByField().socialSecurityNumber}>
                <input class="sb-input" inputmode="numeric" autocomplete="off" value={form.socialSecurityNumber} onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)} />
              </FormField>
            </Show>
          </div>
        </Show>
      </div>
      <div class="sb-switches__row">
        <button type="button" class="sb-switches__switch" role="switch" aria-checked={isMutualCardOn()} onClick={() => setIsMutualCardOn(!isMutualCardOn())}>
          <span class="sb-switches__knob" aria-hidden="true" />
          Mutuelle
        </button>
        <Show when={isMutualCardOn()}>
          <div class="sb-switches__content">
            <FormField label="Votre carte" hint="Un PDF, ou vos photos : le recto et le verso en une fois." error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
              <input class="sb-input" type="file" accept={imageOrPdf} multiple onInput={(event) => setMutualCardFiles(Array.from(event.currentTarget.files ?? []))} />
            </FormField>
          </div>
        </Show>
      </div>
    </div>
  );
}
