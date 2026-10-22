import { Show } from 'solid-js';

/** Portrait vertical, ou les initiales en grand quand la photo manque. */
export function Portrait(props: { photoUrl?: string; initials: string }) {
  return (
    <Show
      when={props.photoUrl}
      fallback={
        <span class="at-portrait at-portrait--initials" aria-hidden="true">
          {props.initials}
        </span>
      }
    >
      {(photoUrl) => <img class="at-portrait" src={photoUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
