import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';

/** Une jauge de pages : une diode par page possible, allumée quand la page est jointe, et la liste des fichiers dessous. */
export function PrescriptionPagesList(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;
  const pageSlots = () => Array.from({ length: MaximumPrescriptionPages }, (_, index) => index);

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="sb-field">
      <span class="sb-field__label">Votre ordonnance</span>
      <div class="sb-gauge">
        <ul class="sb-gauge__leds" aria-hidden="true">
          <For each={pageSlots()}>{(slot) => <li class="sb-gauge__led" classList={{ 'sb-gauge__led--lit': slot < props.pages.length }} />}</For>
        </ul>
        <span class="sb-gauge__count">
          {props.pages.length} / {MaximumPrescriptionPages} pages
        </span>
      </div>
      <Show when={props.pages.length > 0}>
        <ul class="sb-gauge__files">
          <For each={props.pages}>
            {(page, index) => (
              <li class="sb-gauge__file">
                <span class="sb-gauge__file-name">
                  {index() + 1}. {page.name}
                </span>
                <button type="button" class="sb-text-button" onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}>
                  Retirer
                </button>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Show when={canAddPage()}>
        <div class="sb-gauge__actions">
          <label class="sb-gauge__action">
            <input class="sb-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            Prendre en photo
          </label>
          <label class="sb-gauge__action">
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
