import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';

function describePageKind(page: File): string {
  return page.type === 'application/pdf' ? 'PDF' : 'Photo';
}

/** Une grille de vignettes carrées, une par page, et une dernière vignette « + » pour en ajouter : sur téléphone, la photo ouvre l'appareil. */
export function PrescriptionPagesList(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="sc-field">
      <span class="sc-field__label">Votre ordonnance</span>
      <span class="sc-field__hint">Photo ou PDF, jusqu'à {MaximumPrescriptionPages} pages.</span>
      <ul class="sc-thumbs">
        <For each={props.pages}>
          {(page, index) => (
            <li class="sc-thumbs__thumb">
              <span class="sc-thumbs__kind">{describePageKind(page)}</span>
              <span class="sc-thumbs__name">{page.name}</span>
              <span class="sc-thumbs__index">{index() + 1}</span>
              <button
                type="button"
                class="sc-thumbs__remove"
                aria-label={`Retirer la page ${index() + 1}`}
                onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}
              >
                ×
              </button>
            </li>
          )}
        </For>
        <Show when={canAddPage()}>
          <li class="sc-thumbs__thumb sc-thumbs__thumb--add">
            <span class="sc-thumbs__plus" aria-hidden="true">
              +
            </span>
            <label class="sc-thumbs__action">
              <input class="sc-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
              Photographier
            </label>
            <label class="sc-thumbs__action">
              <input class="sc-visually-hidden" type="file" accept="image/*,application/pdf" multiple onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
              Un fichier
            </label>
          </li>
        </Show>
      </ul>
      <Show when={props.error}>
        {(error) => (
          <span class="sc-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
