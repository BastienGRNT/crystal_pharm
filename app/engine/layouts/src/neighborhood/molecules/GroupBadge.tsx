import type { PharmacyGroup } from '@crystal-pharm/schema';
import { Show } from 'solid-js';

/** Le réseau de la pharmacie, discret : un gage de confiance, pas une publicité. */
export function GroupBadge(props: { group: PharmacyGroup }) {
  return (
    <span class="nb-group-badge">
      <Show when={props.group.logoUrl}>{(logoUrl) => <img class="nb-group-badge__logo" src={logoUrl()} alt="" />}</Show>
      <span>
        Membre du réseau <strong>{props.group.name}</strong>
      </span>
    </span>
  );
}
