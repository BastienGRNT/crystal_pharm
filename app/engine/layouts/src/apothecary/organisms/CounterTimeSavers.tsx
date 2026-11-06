import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

const imageOrPdf = 'image/*,application/pdf';

/** Carte Vitale et mutuelle : deux cartes côte à côte, chacune sous son titre en petites capitales. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;

  return (
    <div class="ap-cards">
      <p class="ap-cards__intro">Si vous le souhaitez, ces deux pièces nous évitent de vous les demander au comptoir.</p>
      <fieldset class="ap-cards__card">
        <legend class="ap-cards__title">Carte Vitale</legend>
        <div class="ap-cards__switch" role="group" aria-label="Comment nous donner votre carte Vitale">
          <button type="button" aria-pressed={vitalCardMode() === 'photo'} onClick={() => setVitalCardMode('photo')}>
            Sa photo
          </button>
          <button type="button" aria-pressed={vitalCardMode() === 'number'} onClick={() => setVitalCardMode('number')}>
            Son numéro
          </button>
        </div>
        <Show
          when={vitalCardMode() === 'number'}
          fallback={
            <FormField label="Photo de la carte" error={errorsByField().vitalCardPhoto}>
              <input class="ap-input" type="file" accept={imageOrPdf} onInput={(event) => updateField('vitalCardPhoto', event.currentTarget.files?.[0])} />
            </FormField>
          }
        >
          <FormField label="Numéro de sécurité sociale" hint="15 chiffres." error={errorsByField().socialSecurityNumber}>
            <input class="ap-input" inputmode="numeric" autocomplete="off" value={form.socialSecurityNumber} onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)} />
          </FormField>
        </Show>
      </fieldset>
      <fieldset class="ap-cards__card">
        <legend class="ap-cards__title">Mutuelle</legend>
        <FormField label="Votre carte" hint="Un PDF, ou vos photos : le recto et le verso en une fois." error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
          <input class="ap-input" type="file" accept={imageOrPdf} multiple onInput={(event) => setMutualCardFiles(Array.from(event.currentTarget.files ?? []))} />
        </FormField>
      </fieldset>
    </div>
  );
}
