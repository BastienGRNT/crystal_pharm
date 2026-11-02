import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';
import { Ornament } from '../atoms/Ornament';
import { Cartouche } from '../molecules/Cartouche';

const defaultHeadline = 'Conseils et préparations, au cœur du quartier.';

/** Le nom de la pharmacie sur une grande étiquette de bocal ; la photo, encadrée, quand il y en a une. */
export function HeroSection(props: HeroSectionProps) {
  return (
    <section class="ap-hero" aria-labelledby="ap-hero-title">
      <Cartouche class="ap-hero__label">
        <p class="ap-hero__eyebrow">Officine · {props.pharmacy.address.city}</p>
        <h1 class="ap-hero__title" id="ap-hero-title">
          {props.pharmacy.name}
        </h1>
        <Ornament />
        <p class="ap-hero__headline">{props.headline ?? defaultHeadline}</p>
        <p class="ap-hero__address">
          {props.pharmacy.address.street}, {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
        </p>
      </Cartouche>
      <Show when={props.imageUrl}>{(imageUrl) => <img class="ap-hero__image" src={imageUrl()} alt="" />}</Show>
    </section>
  );
}
