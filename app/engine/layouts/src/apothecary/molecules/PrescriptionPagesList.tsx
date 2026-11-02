import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';

const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

/** Des feuillets numérotés en chiffres romains, alignés comme les pages d'un registre, et un dernier feuillet vierge pour en ajouter : sur téléphone, la photo ouvre l'appareil. */
export function PrescriptionPagesList(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="ap-field">
      <span class="ap-field__label">Les feuillets de l'ordonnance</span>
      <span class="ap-field__hint">Photo ou PDF, jusqu'à {MaximumPrescriptionPages} feuillets.</span>
      <ol class="ap-folios">
        <For each={props.pages}>
          {(page, index) => (
            <li class="ap-folios__folio">
              <span class="ap-folios__numeral">{romanNumerals[index()] ?? index() + 1}</span>
              <span class="ap-folios__name">{page.name}</span>
              <button type="button" class="ap-text-button" onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}>
                Retirer
              </button>
            </li>
          )}
        </For>
        <Show when={canAddPage()}>
          <li class="ap-folios__folio ap-folios__folio--blank">
            <span class="ap-folios__numeral">{romanNumerals[props.pages.length] ?? props.pages.length + 1}</span>
            <label class="ap-folios__add">
              <input class="ap-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
              Photographier
            </label>
            <label class="ap-folios__add">
              <input class="ap-visually-hidden" type="file" accept="image/*,application/pdf" multiple onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
              Joindre un fichier
            </label>
          </li>
        </Show>
      </ol>
      <Show when={props.error}>
        {(error) => (
          <span class="ap-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
