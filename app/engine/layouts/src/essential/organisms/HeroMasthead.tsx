import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';

/** Le nom de la pharmacie en énorme. Une image fournie par la pharmacie s'affiche en noir et blanc ; sans image, rien : le layout reste typographique. */
export function HeroMasthead(props: HeroSectionProps) {
  return (
    <header class="essential-masthead">
      <Show when={props.pharmacy.logoUrl}>{(logoUrl) => <img class="essential-masthead__logo" src={logoUrl()} alt="" />}</Show>
      <h1 class="essential-masthead__name">{props.pharmacy.name}</h1>
      <Show when={props.headline}>{(headline) => <p class="essential-masthead__headline">{headline()}</p>}</Show>
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
      <Show when={props.imageUrl}>{(imageUrl) => <img class="essential-masthead__image" src={imageUrl()} alt="" />}</Show>
    </header>
  );
}
