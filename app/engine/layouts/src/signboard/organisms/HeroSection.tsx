import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';
import { LedCross } from '../atoms/LedCross';

const defaultHeadline = 'Votre pharmacie, allumée pour vous.';

/** Le nom en grand et la croix lumineuse ; la photo de la pharmacie prend sa place quand il y en a une. */
export function HeroSection(props: HeroSectionProps) {
  return (
    <section class="sb-hero" aria-labelledby="sb-hero-title">
      <div class="sb-hero__text">
        <p class="sb-hero__eyebrow">Pharmacie · {props.pharmacy.address.city}</p>
        <h1 class="sb-hero__title" id="sb-hero-title">
          {props.pharmacy.name}
        </h1>
        <p class="sb-hero__headline">{props.headline ?? defaultHeadline}</p>
      </div>
      <div class="sb-hero__visual">
        <Show when={props.imageUrl} fallback={<LedCross class="sb-hero__cross" />}>
          {(imageUrl) => (
            <>
              <img class="sb-hero__image" src={imageUrl()} alt="" />
              <LedCross class="sb-hero__cross sb-hero__cross--corner" />
            </>
          )}
        </Show>
      </div>
    </section>
  );
}
