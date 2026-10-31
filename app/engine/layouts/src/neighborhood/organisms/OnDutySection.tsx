import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';

/** Un bandeau coloré, présent seulement quand la pharmacie est de garde. */
export function OnDutySection(props: OnDutySectionProps) {
  return (
    <Show when={props.announcement}>
      {(announcement) => (
        <p class="nb-on-duty-banner" classList={{ 'nb-on-duty-banner--now': announcement().status === 'onDutyNow' }} role="status">
          <span class="nb-on-duty-banner__dot" aria-hidden="true" />
          {announcement().message}
        </p>
      )}
    </Show>
  );
}
