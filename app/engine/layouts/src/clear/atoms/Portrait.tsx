import { Show } from 'solid-js';

/** La photo de la personne ; sans photo, ses initiales. */
export function Portrait(props: { photoUrl?: string; initials: string }) {
  return (
    <Show
      when={props.photoUrl}
      fallback={
        <span class="cl-portrait cl-portrait--initials" aria-hidden="true">
          {props.initials}
        </span>
      }
    >
      {(photoUrl) => <img class="cl-portrait" src={photoUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
