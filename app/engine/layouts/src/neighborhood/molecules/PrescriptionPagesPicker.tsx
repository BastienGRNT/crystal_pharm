import { MaximumPrescriptionPages } from '@crystal-pharm/schema';
import { createMemo, For, onCleanup, Show } from 'solid-js';
import { Icon } from '../atoms/Icon';

/**
 * Prendre l'ordonnance en photo, page après page, et voir ce qu'on envoie. Sur téléphone, « Prendre en photo » ouvre
 * directement l'appareil photo ; sur ordinateur, les deux boutons ouvrent le choix d'un fichier.
 */
export function PrescriptionPagesPicker(props: { pages: File[]; error: string | undefined; onChange: (pages: File[]) => void }) {
  const previews = createMemo(() => {
    const pagePreviews = props.pages.map((page) => ({ page, imageUrl: page.type.startsWith('image/') ? URL.createObjectURL(page) : undefined }));
    onCleanup(() => pagePreviews.forEach((preview) => preview.imageUrl && URL.revokeObjectURL(preview.imageUrl)));
    return pagePreviews;
  });
  const canAddPage = () => props.pages.length < MaximumPrescriptionPages;

  function addPages(newPages: File[]): void {
    props.onChange([...props.pages, ...newPages].slice(0, MaximumPrescriptionPages));
  }

  return (
    <div class="nb-pages" classList={{ 'nb-field--invalid': props.error !== undefined }}>
      <Show when={props.pages.length > 0}>
        <ol class="nb-pages__list" aria-label="Pages de l’ordonnance">
          <For each={previews()}>
            {(preview, index) => (
              <li class="nb-pages__page">
                <Show when={preview.imageUrl} fallback={<span class="nb-pages__document"><Icon name="file" />PDF</span>}>
                  {(imageUrl) => <img class="nb-pages__thumbnail" src={imageUrl()} alt="" />}
                </Show>
                <span class="nb-pages__caption">Page {index() + 1}</span>
                <button
                  type="button"
                  class="nb-pages__remove"
                  aria-label={`Retirer la page ${index() + 1}`}
                  onClick={() => props.onChange(props.pages.filter((_, pageIndex) => pageIndex !== index()))}
                >
                  <Icon name="close" />
                </button>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <Show when={canAddPage()}>
        <div class="nb-pages__actions" classList={{ 'nb-pages__actions--first': props.pages.length === 0 }}>
          <label class="nb-pages__button nb-pages__button--main">
            <input class="nb-visually-hidden" type="file" accept="image/*" capture="environment" onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))} />
            <Icon name="camera" />
            {props.pages.length === 0 ? 'Prendre en photo mon ordonnance' : 'Photographier une autre page'}
          </label>
          <label class="nb-pages__button">
            <input
              class="nb-visually-hidden"
              type="file"
              accept="image/*,application/pdf"
              multiple
              onInput={(event) => addPages(Array.from(event.currentTarget.files ?? []))}
            />
            <Icon name="file" />
            {props.pages.length === 0 ? 'Choisir une photo ou un PDF' : 'Ajouter un fichier'}
          </label>
        </div>
      </Show>
      <p class="nb-pages__hint">Posez l’ordonnance à plat, bien éclairée, toute la page visible. Jusqu’à {MaximumPrescriptionPages} pages.</p>
      <Show when={props.error}>
        {(error) => (
          <span class="nb-field__error" role="alert">
            {error()}
          </span>
        )}
      </Show>
    </div>
  );
}
