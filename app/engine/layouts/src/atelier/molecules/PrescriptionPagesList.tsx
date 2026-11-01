import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { For, Show } from 'solid-js';

/** Les pages de l'ordonnance, numérotées comme un sommaire, et de quoi en ajouter : sur téléphone, la photo ouvre l'appareil. */
export function PrescriptionPagesList(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="at-field" classList={{ 'at-field--invalid': props.error !== undefined }}>
      <span class="at-field__label">L'ordonnance</span>
      <span class="at-field__hint">À plat, bien éclairée, toute la page visible. Jusqu'à {MaximumPrescriptionPages} pages.</span>
      <Show when={props.pages.length > 0}>
        <ol class="at-pages">
          <For each={props.pages}>
            {(page, index) => (
              <li class="at-pages__page">
                <span class="at-pages__number">{String(index() + 1).padStart(2, '0')}</span>
                <span class="at-pages__name">{page.name}</span>
                <button type="button" class="at-wizard__link" onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}>
                  Retirer
                </button>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <Show when={canAddPage()}>
        <div class="at-pages__actions">
          <label class="at-button">
            <input class="at-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            {props.pages.length === 0 ? 'Prendre en photo' : 'Photographier une autre page'}
          </label>
          <label class="at-button at-button--ghost">
            <input class="at-visually-hidden" type="file" accept="image/*,application/pdf" multiple onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            Choisir un fichier
          </label>
        </div>
      </Show>
      <Show when={props.error}>
        {(error) => (
          <span class="at-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
