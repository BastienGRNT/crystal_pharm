import type { PharmacyGroup } from '@crystal-pharm/schema';
import { Show } from 'solid-js';

/** Bandeau de co-marquage tout en haut de chaque page, quand la pharmacie appartient à un groupement. */
export function GroupBar(props: { group: PharmacyGroup }) {
  return (
    <aside class="nb-group-bar" aria-label="Groupement">
      <span>Pharmacie membre du réseau</span>
      <Show when={props.group.logoUrl}>{(logoUrl) => <img class="nb-group-bar__logo" src={logoUrl()} alt="" />}</Show>
      <span class="nb-group-bar__name">{props.group.name}</span>
    </aside>
  );
}
