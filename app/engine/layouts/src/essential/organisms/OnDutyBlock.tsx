import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';

/** Le bandeau n'existe que lorsque la pharmacie est de garde. */
export function OnDutyBlock(props: OnDutySectionProps) {
  return (
    <Show when={props.announcement}>
      {(announcement) => (
        <p class="essential-on-duty" role="status">
          {announcement().message}
        </p>
      )}
    </Show>
  );
}
