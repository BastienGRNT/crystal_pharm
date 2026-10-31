import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';

/** Un aplat d'accent quand la pharmacie est de garde, sinon un rappel discret du numéro national. */
export function OnDutyNotice(props: OnDutySectionProps) {
  return (
    <Show
      when={props.announcement}
      fallback={
        <p class="at-on-duty at-on-duty--hotline">
          <a href={`tel:${props.hotline.phoneNumber}`}>{props.hotline.message}</a>
        </p>
      }
    >
      {(announcement) => (
        <p class="at-on-duty" role="status">
          {announcement().message}
        </p>
      )}
    </Show>
  );
}
