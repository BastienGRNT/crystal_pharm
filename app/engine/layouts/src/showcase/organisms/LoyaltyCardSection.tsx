import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function LoyaltyCardSection(props: LoyaltyCardModuleProps) {
  return (
    <section class="sc-section sc-loyalty" aria-labelledby="sc-loyalty-title">
      <Show when={props.imageUrl} fallback={<span class="sc-loyalty__card" aria-hidden="true" />}>
        {(imageUrl) => <img class="sc-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}
      </Show>
      <div class="sc-loyalty__text">
        <h2 class="sc-loyalty__title" id="sc-loyalty-title">
          Carte de fidélité
        </h2>
        <p>{props.text}</p>
        <a class="sc-arrow-link" href={props.url}>
          Découvrir la carte
          <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}
