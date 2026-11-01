import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';
import { GroupBadge } from '../molecules/GroupBadge';

const defaultHeadline = 'Votre pharmacie de quartier, toujours à votre écoute.';

/** Le nom, l'adresse et l'accroche ; la photo seulement si la pharmacie en a une : jamais d'image de remplissage. */
export function HeroSection(props: HeroSectionProps) {
  return (
    <section class="nb-hero" classList={{ 'nb-hero--with-image': props.imageUrl !== undefined }} aria-labelledby="nb-hero-title">
      <div class="nb-hero__text">
        <p class="nb-hero__address">
          {props.pharmacy.address.street} · {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
        </p>
        <h1 class="nb-hero__title" id="nb-hero-title">
          {props.pharmacy.name}
        </h1>
        <p class="nb-hero__slogan">{props.headline ?? defaultHeadline}</p>
        <Show when={props.pharmacy.group}>{(group) => <GroupBadge group={group()} />}</Show>
      </div>
      <Show when={props.imageUrl}>{(imageUrl) => <img class="nb-hero__image" src={imageUrl()} alt="" />}</Show>
    </section>
  );
}
