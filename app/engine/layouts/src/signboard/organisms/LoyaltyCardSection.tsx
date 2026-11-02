import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function LoyaltyCardSection(props: LoyaltyCardModuleProps) {
  return (
    <section class="sb-section sb-loyalty" aria-labelledby="sb-loyalty-title">
      <Show when={props.imageUrl} fallback={<span class="sb-loyalty__card" aria-hidden="true" />}>
        {(imageUrl) => <img class="sb-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}
      </Show>
      <div class="sb-loyalty__text">
        <h2 class="sb-loyalty__title" id="sb-loyalty-title">
          Carte de fidélité
        </h2>
        <p>{props.text}</p>
        <a class="sb-arrow-link" href={props.url}>
          Découvrir la carte
          <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}
