import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';

/** Les pages de l'ordonnance, une ligne chacune, et de quoi en ajouter : sur téléphone, la photo ouvre l'appareil. */
export function PrescriptionPagesList(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="sb-field">
      <span class="sb-field__label">Votre ordonnance</span>
      <span class="sb-field__hint">Photo ou PDF, jusqu'à {MaximumPrescriptionPages} pages.</span>
      <Show when={props.pages.length > 0}>
        <ol class="sb-pages">
          <For each={props.pages}>
            {(page, index) => (
              <li class="sb-pages__page">
                <span class="sb-pages__name">
                  Page {index() + 1} : {page.name}
                </span>
                <button type="button" class="sb-text-button" onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}>
                  Retirer
                </button>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <Show when={canAddPage()}>
        <div class="sb-pages__actions">
          <label class="sb-pages__button sb-pages__button--main">
            <input class="sb-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            {props.pages.length === 0 ? 'Photographier' : 'Ajouter une page'}
          </label>
          <label class="sb-pages__button">
            <input class="sb-visually-hidden" type="file" accept="image/*,application/pdf" multiple onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            Choisir un fichier
          </label>
        </div>
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="sb-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
