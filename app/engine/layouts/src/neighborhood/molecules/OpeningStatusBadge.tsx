import { Show } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';
import { PharmacyCross } from '../atoms/PharmacyCross';

/** « Ouvert · ferme à 19 h 30 », la croix allumée ou éteinte : l'information qu'on vient chercher en premier. */
export function OpeningStatusBadge(props: { status: OpeningStatus; size?: 'small' | 'large' }) {
  return (
    <p class={`nb-status nb-status--${props.status.state} nb-status--${props.size ?? 'small'}`} aria-live="polite">
      <PharmacyCross class="nb-status__cross" />
      <span class="nb-status__label">{props.status.label}</span>
      <Show when={props.status.detail}>
        <span class="nb-status__detail">{props.status.detail}</span>
      </Show>
    </p>
  );
}
