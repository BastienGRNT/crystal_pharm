import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';
import { PharmacyMark } from '../atoms/PharmacyMark';

const defaultHeadline = 'Conseil, soin et beauté, au même endroit.';

/** La photo de l'officine en plein cadre, l'accroche par-dessus ; sans photo, un aplat teinté et une grande croix au trait. */
export function HeroSection(props: HeroSectionProps) {
  return (
    <section class="sc-hero" classList={{ 'sc-hero--with-image': props.imageUrl !== undefined }} aria-labelledby="sc-hero-title">
      <Show when={props.imageUrl} fallback={<PharmacyMark class="sc-hero__cross" />}>
        {(imageUrl) => <img class="sc-hero__image" src={imageUrl()} alt="" />}
      </Show>
      <div class="sc-hero__content">
        <h1 class="sc-hero__title" id="sc-hero-title">
          <span class="sc-hero__name">
            {props.pharmacy.name} · {props.pharmacy.address.city}
          </span>
          <span class="sc-hero__headline">{props.headline ?? defaultHeadline}</span>
        </h1>
      </div>
    </section>
  );
}
