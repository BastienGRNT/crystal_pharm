import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function LoyaltyCardSection(props: LoyaltyCardModuleProps) {
  return (
    <section class="ap-section ap-loyalty" aria-labelledby="ap-loyalty-title">
      <Show when={props.imageUrl} fallback={<span class="ap-loyalty__card" aria-hidden="true" />}>
        {(imageUrl) => <img class="ap-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}
      </Show>
      <div class="ap-loyalty__text">
        <h2 class="ap-loyalty__title" id="ap-loyalty-title">
          Carte de fidélité
        </h2>
        <p>{props.text}</p>
        <a class="ap-arrow-link" href={props.url}>
          Découvrir la carte
          <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}
