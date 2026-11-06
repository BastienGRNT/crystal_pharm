import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';

/** Un tableau à deux colonnes (numéro, fichier), et deux liens sous la dernière ligne pour en ajouter : sur téléphone, la photo ouvre l'appareil. */
export function PrescriptionPagesList(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="cl-field">
      <span class="cl-field__hint">Photo ou PDF, jusqu'à {MaximumPrescriptionPages} pages.</span>
      <ol class="cl-leaves">
        <For each={props.pages}>
          {(page, index) => (
            <li class="cl-leaves__row">
              <span class="cl-leaves__number">{index() + 1}</span>
              <span class="cl-leaves__name">{page.name}</span>
              <button type="button" class="cl-text-button" onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}>
                Retirer
              </button>
            </li>
          )}
        </For>
        <Show when={props.pages.length === 0}>
          <li class="cl-leaves__row cl-leaves__row--empty">Aucune page pour l'instant.</li>
        </Show>
      </ol>
      <Show when={canAddPage()}>
        <div class="cl-leaves__actions">
          <label class="cl-leaves__add">
            <input class="cl-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            + {props.pages.length === 0 ? 'Prendre en photo' : 'Photographier une autre page'}
          </label>
          <label class="cl-leaves__add">
            <input class="cl-visually-hidden" type="file" accept="image/*,application/pdf" multiple onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            + Choisir un fichier
          </label>
        </div>
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="cl-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
