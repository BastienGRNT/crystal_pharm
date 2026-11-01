import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';

/** Ouvert ou fermé, en tête et en capitales : la question qu'on se pose avant toutes les autres. */
export function OpeningStatusStrip(props: { status: OpeningStatus; pharmacy: Readonly<PharmacyInfo> }) {
  return (
    <div class={`essential-status essential-status--${props.status.state}`} aria-live="polite">
      <p class="essential-status__text">
        <span class="essential-status__label">{props.status.label}</span>
        <Show when={props.status.detail}>
          <span class="essential-status__detail"> — {props.status.detail}</span>
        </Show>
      </p>
      <a class="essential-status__phone" href={`tel:${props.pharmacy.phone.replace(/[^\d+]/g, '')}`}>
        ☎ {props.pharmacy.phone}
      </a>
    </div>
  );
}
