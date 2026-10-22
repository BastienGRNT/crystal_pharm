import type { PharmacyGroup } from '@crystal-pharm/schema';
import { Show } from 'solid-js';

export function GroupBadge(props: { group: PharmacyGroup }) {
  return (
    <span class="nb-group-badge">
      <Show when={props.group.logoUrl} fallback={<span class="nb-group-badge__name">Groupement {props.group.name}</span>}>
        {(logoUrl) => <img class="nb-group-badge__logo" src={logoUrl()} alt={`Groupement ${props.group.name}`} />}
      </Show>
    </span>
  );
}
