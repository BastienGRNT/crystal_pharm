import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show, type JSX } from 'solid-js';

/** Le nom de la pharmacie en très grand, puis tous les modules serrés dans une grille. Rien d'autre. */
export function DenseGridTemplate(props: { pharmacy: Readonly<PharmacyInfo>; children: JSX.Element }) {
  return (
    <main class="essential">
      <header class="essential-masthead">
        <Show when={props.pharmacy.logoUrl}>{(logoUrl) => <img class="essential-masthead__logo" src={logoUrl()} alt="" />}</Show>
        <h1 class="essential-masthead__name">{props.pharmacy.name}</h1>
        <p class="essential-masthead__contact">
          {props.pharmacy.address.street} — {props.pharmacy.address.postalCode} {props.pharmacy.address.city} —{' '}
          <a href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>{props.pharmacy.phone}</a>
        </p>
        <Show when={props.pharmacy.group}>
          {(group) => (
            <p class="essential-masthead__group">
              <Show when={group().logoUrl}>{(groupLogoUrl) => <img class="essential-masthead__group-logo" src={groupLogoUrl()} alt="" />}</Show>
              Membre du groupement {group().name}
            </p>
          )}
        </Show>
      </header>
      <div class="essential-grid">{props.children}</div>
    </main>
  );
}
