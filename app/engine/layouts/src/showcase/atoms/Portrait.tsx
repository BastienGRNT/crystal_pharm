import { Show } from 'solid-js';

/** La photo de la personne ; sans photo, ses initiales. */
export function Portrait(props: { photoUrl?: string; initials: string }) {
  return (
    <Show
      when={props.photoUrl}
      fallback={
        <span class="sc-portrait sc-portrait--initials" aria-hidden="true">
          {props.initials}
        </span>
      }
    >
      {(photoUrl) => <img class="sc-portrait" src={photoUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
