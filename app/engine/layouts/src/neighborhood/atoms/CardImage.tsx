import { Show } from 'solid-js';

/** L'image de la carte, ou un motif de croix pharmacie quand elle manque. */
export function CardImage(props: { imageUrl?: string }) {
  return (
    <Show when={props.imageUrl} fallback={<div class="nb-card-image nb-card-image--placeholder" aria-hidden="true" />}>
      {(imageUrl) => <img class="nb-card-image" src={imageUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
