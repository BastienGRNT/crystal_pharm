import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';

/** Un bandeau coloré quand la pharmacie est de garde, sinon un rappel discret du numéro national. */
export function OnDutySection(props: OnDutySectionProps) {
  return (
    <Show
      when={props.announcement}
      fallback={
        <p class="nb-on-duty-banner nb-on-duty-banner--hotline">
          {props.hotline.message} <a href={`tel:${props.hotline.phoneNumber}`}>{props.hotline.phoneNumber}</a>
        </p>
      }
    >
      {(announcement) => (
        <p class="nb-on-duty-banner" classList={{ 'nb-on-duty-banner--now': announcement().status === 'onDutyNow' }} role="status">
          <span class="nb-on-duty-banner__dot" aria-hidden="true" />
          {announcement().message}
        </p>
      )}
    </Show>
  );
}
