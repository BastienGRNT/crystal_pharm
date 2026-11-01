import { createSignal, Show } from 'solid-js';
import type { PrescriptionFormState } from '@crystal-pharm/renderer';
import { FileDropzone } from '../molecules/FileDropzone';
import { FormField } from '../molecules/FormField';
import { OptionSwitch } from '../molecules/OptionSwitch';

/** Carte Vitale et mutuelle : facultatives, repliées, mais c'est autant de temps gagné au comptoir. */
export function CounterTimeSavers(props: { state: PrescriptionFormState }) {
  const [vitalCardMode, setVitalCardMode] = createSignal<'photo' | 'number'>('photo');
  const { form, updateField, setMutualCardFiles, errorsByField } = props.state;
  const mutualCardFileNames = () =>
    [form.mutualCardFront, form.mutualCardBack]
      .filter((file) => file !== undefined)
      .map((file) => file.name)
      .join(' · ');
  const vitalCardError = () => errorsByField().vitalCardPhoto ?? errorsByField().socialSecurityNumber;
  const hasError = () => vitalCardError() !== undefined || errorsByField().mutualCardFront !== undefined || errorsByField().mutualCardBack !== undefined;

  return (
    <details class="nb-timesavers" open={hasError()}>
      <summary class="nb-timesavers__summary">
        <span class="nb-timesavers__title">Première visite ? Ajoutez votre carte Vitale et votre mutuelle</span>
        <span class="nb-timesavers__text">Facultatif. Vous n’aurez rien à sortir au comptoir.</span>
      </summary>
      <div class="nb-timesavers__body">
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
              aria-label="Numéro de sécurité sociale"
              placeholder="Les 15 chiffres, au dos de votre attestation"
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
        <FormField label="Carte de mutuelle" hint="Un PDF, ou une photo du recto et une du verso." error={errorsByField().mutualCardFront ?? errorsByField().mutualCardBack}>
          <FileDropzone prompt="Choisir le recto et le verso" fileNames={mutualCardFileNames()} multiple onFiles={setMutualCardFiles} />
        </FormField>
      </div>
    </details>
  );
}
