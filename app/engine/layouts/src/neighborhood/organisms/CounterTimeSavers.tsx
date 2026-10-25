import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FileDropzone } from '../molecules/FileDropzone';
import { FormField } from '../molecules/FormField';
import { OptionSwitch } from '../molecules/OptionSwitch';

/** Carte Vitale et mutuelle : facultatives, mais c'est autant de temps gagné au comptoir. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;
  const mutualCardFileNames = () => [form.mutualCardFront, form.mutualCardBack].filter((file) => file !== undefined).map((file) => file.name).join(' · ');
  const vitalCardError = () => errorsByField().vitalCardPhoto ?? errorsByField().socialSecurityNumber;

  return (
    <fieldset class="nb-timesavers">
      <legend class="nb-timesavers__legend">Facultatif · gagnez du temps au comptoir</legend>
      <p class="nb-timesavers__text">Ajoutées maintenant, ces informations nous évitent de vous les demander à votre arrivée.</p>
      <div class="nb-field" classList={{ 'nb-field--invalid': vitalCardError() !== undefined }}>
        <span class="nb-field__label">Carte Vitale</span>
        <OptionSwitch
          label="Comment nous donner votre carte Vitale"
          options={[
            { value: 'photo', title: 'En photo' },
            { value: 'number', title: 'Par son numéro' },
          ]}
          value={vitalCardMode()}
          onChange={setVitalCardMode}
        />
        <Show
          when={vitalCardMode() === 'number'}
          fallback={<FileDropzone prompt="Photo de la carte Vitale" fileNames={form.vitalCardPhoto?.name ?? ''} onFiles={(files) => updateField('vitalCardPhoto', files[0])} />}
        >
          <input
            class="nb-input"
            inputmode="numeric"
            autocomplete="off"
            placeholder="15 chiffres, au dos de votre attestation"
            value={form.socialSecurityNumber}
            onInput={(event) => updateField('socialSecurityNumber', event.currentTarget.value)}
          />
        </Show>
        <Show when={vitalCardError()}>
          {(error) => (
            <span class="nb-field__error" role="alert">
              {error()}
            </span>
          )}
        </Show>
      </div>
      <FormField label="Mutuelle" error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
        <FileDropzone prompt="Un PDF, ou vos photos (recto et verso en une fois)" fileNames={mutualCardFileNames()} multiple onFiles={setMutualCardFiles} />
      </FormField>
    </fieldset>
  );
}
