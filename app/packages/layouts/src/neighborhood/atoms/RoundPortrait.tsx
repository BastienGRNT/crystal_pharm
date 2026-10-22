import { Show } from 'solid-js';

/** Photo ronde, ou les initiales sur un fond doux quand la photo manque. */
export function RoundPortrait(props: { photoUrl?: string; initials: string }) {
  return (
    <Show
      when={props.photoUrl}
      fallback={
        <span class="nb-portrait nb-portrait--initials" aria-hidden="true">
          {props.initials}
        </span>
      }
    >
      {(photoUrl) => <img class="nb-portrait" src={photoUrl()} alt="" loading="lazy" />}
    </Show>
  );
}
