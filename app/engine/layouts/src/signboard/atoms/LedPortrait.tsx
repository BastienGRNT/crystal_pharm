import { Show } from 'solid-js';

/** La photo, légèrement teintée ; sans photo, les initiales en lettres lumineuses. */
export function LedPortrait(props: { photoUrl?: string; initials: string }) {
  return (
    <Show
      when={props.photoUrl}
      fallback={
        <span class="sb-portrait sb-portrait--initials" aria-hidden="true">
          {props.initials}
        </span>
      }
    >
      {(photoUrl) => <img class="sb-portrait" src={photoUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
