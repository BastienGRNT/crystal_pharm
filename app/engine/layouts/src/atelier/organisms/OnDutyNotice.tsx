import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';

/** Un aplat d'accent, présent seulement quand la pharmacie est de garde. */
export function OnDutyNotice(props: OnDutySectionProps) {
  return (
    <Show when={props.announcement}>
      {(announcement) => (
        <p class="at-on-duty" role="status">
          {announcement().message}
        </p>
      )}
    </Show>
  );
}
