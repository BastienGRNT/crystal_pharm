import type { PharmacyGroup } from '@crystal-pharm/schema';
import { Show } from 'solid-js';

/** Le groupement mis en avant dans le hero : gros logo, ou son nom en grand s'il n'a pas de logo. */
export function GroupSpotlight(props: { group: PharmacyGroup }) {
  return (
    <div class="nb-group-spotlight">
      <Show when={props.group.logoUrl}>
        {(logoUrl) => <img class="nb-group-spotlight__logo" src={logoUrl()} alt="" />}
      </Show>
      <div class="nb-group-spotlight__text">
        <span class="nb-group-spotlight__label">Pharmacie membre du réseau</span>
        <strong class="nb-group-spotlight__name">{props.group.name}</strong>
      </div>
    </div>
  );
}
