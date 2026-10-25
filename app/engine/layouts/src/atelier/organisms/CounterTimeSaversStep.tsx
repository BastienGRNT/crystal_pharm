import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FormField } from '../molecules/FormField';

/** Carte Vitale et mutuelle : facultatives, mais c'est autant de temps gagné au comptoir. */
export function CounterTimeSaversStep(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;
  const mutualCardFileNames = () => [form.mutualCardFront, form.mutualCardBack].filter((file) => file !== undefined).map((file) => file.name).join(' · ');

  return (
    <div class="at-steps__step">
      <p class="at-prescription__introduction">Facultatif, mais ça nous fait gagner du temps à tous : ce que vous ajoutez ici, nous n'aurons pas à vous le demander au comptoir.</p>
      <div class="at-choice" role="group" aria-label="Comment nous donner votre carte Vitale">
        <button type="button" aria-pressed={vitalCardMode() === 'photo'} onClick={() => setVitalCardMode('photo')}>
          Carte Vitale en photo
        </button>
        <button type="button" aria-pressed={vitalCardMode() === 'number'} onClick={() => setVitalCardMode('number')}>
          Ou son numéro
        </button>
      </div>
      <Show
        when={vitalCardMode() === 'number'}
        fallback={
          <FormField label="Photo de la carte Vitale" error={errorsByField().vitalCardPhoto}>
            <PhotoPicker fileNames={form.vitalCardPhoto?.name ?? ''} prompt="Choisir une photo" onFiles={(files) => updateField('vitalCardPhoto', files[0])} />
          </FormField>
        }
      >
        <FormField label="Numéro de sécurité sociale" hint="15 chiffres" error={errorsByField().socialSecurityNumber}>
          <input
            class="at-input"
            inputmode="numeric"
            autocomplete="off"
            value={form.socialSecurityNumber}
            onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)}
          />
        </FormField>
      </Show>
      <FormField label="Mutuelle" hint="Un PDF, ou vos photos : recto et verso en une fois" error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
        <PhotoPicker fileNames={mutualCardFileNames()} prompt="Choisir un ou deux fichiers" multiple onFiles={setMutualCardFiles} />
      </FormField>
    </div>
  );
}

function PhotoPicker(props: { fileNames: string; prompt: string; multiple?: boolean; onFiles: (files: File[]) => void }) {
  return (
    <span class="at-file at-file--compact">
      <input
        class="at-file__input"
        type="file"
        accept="image/*,application/pdf"
        multiple={props.multiple}
        onInput={(event) => props.onFiles(Array.from(event.currentTarget.files ?? []))}
      />
      <span class="at-file__label">{props.fileNames || props.prompt}</span>
    </span>
  );
}
