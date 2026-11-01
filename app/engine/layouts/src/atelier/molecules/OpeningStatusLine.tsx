import { Show } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';

/** « Ouvert — ferme à 19 h 30 » : une pastille de couleur, une phrase. Toujours visible, sur toutes les pages. */
export function OpeningStatusLine(props: { status: OpeningStatus }) {
  return (
    <p class={`at-status at-status--${props.status.state}`} aria-live="polite">
      <span class="at-status__dot" aria-hidden="true" />
      <span class="at-status__label">{props.status.label}</span>
      <Show when={props.status.detail}>
        <span class="at-status__detail">{props.status.detail}</span>
      </Show>
    </p>
  );
}
