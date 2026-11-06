import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';

const defaultHeadline = 'Votre pharmacie, simplement.';

/** Le nom en très grand ; la photo de la pharmacie en bande pleine largeur, seulement quand il y en a une. */
export function HeroSection(props: HeroSectionProps) {
  return (
    <section class="cl-hero" aria-labelledby="cl-hero-title">
      <div class="cl-hero__text">
        <p class="cl-hero__eyebrow">Pharmacie · {props.pharmacy.address.city}</p>
        <h1 class="cl-hero__title" id="cl-hero-title">
          {props.pharmacy.name}
        </h1>
        <p class="cl-hero__headline">{props.headline ?? defaultHeadline}</p>
      </div>
      <Show when={props.imageUrl}>{(imageUrl) => <img class="cl-hero__image" src={imageUrl()} alt="" />}</Show>
    </section>
  );
}
