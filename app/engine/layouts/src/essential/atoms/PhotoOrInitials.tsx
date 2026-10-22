import { Show } from 'solid-js';

/** La photo en noir et blanc, ou les initiales dans un carré noir quand elle manque. */
export function PhotoOrInitials(props: { photoUrl?: string; initials: string }) {
  return (
    <Show
      when={props.photoUrl}
      fallback={
        <span class="essential-portrait essential-portrait--initials" aria-hidden="true">
          {props.initials}
        </span>
      }
    >
      {(photoUrl) => <img class="essential-portrait" src={photoUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
