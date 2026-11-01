import { Show } from 'solid-js';
import type { OnDutySectionProps } from '@crystal-pharm/renderer';
import { PharmacyCross } from '../atoms/PharmacyCross';

/** Un bandeau en tête de page, présent seulement quand la pharmacie est de garde. */
export function OnDutySection(props: OnDutySectionProps) {
  return (
    <Show when={props.announcement}>
      {(announcement) => (
        <p class="nb-on-duty-banner" classList={{ 'nb-on-duty-banner--now': announcement().status === 'onDutyNow' }} role="status">
          <PharmacyCross class="nb-on-duty-banner__cross" />
          <span>{announcement().message}</span>
        </p>
      )}
    </Show>
  );
}
