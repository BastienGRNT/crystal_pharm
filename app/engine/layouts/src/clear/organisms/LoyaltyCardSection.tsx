import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function LoyaltyCardSection(props: LoyaltyCardModuleProps) {
  return (
    <section class="cl-section cl-loyalty" aria-labelledby="cl-loyalty-title">
      <Show when={props.imageUrl} fallback={<span class="cl-loyalty__card" aria-hidden="true" />}>
        {(imageUrl) => <img class="cl-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}
      </Show>
      <div class="cl-loyalty__text">
        <h2 class="cl-loyalty__title" id="cl-loyalty-title">
          Carte de fidélité
        </h2>
        <p>{props.text}</p>
        <a class="cl-arrow-link" href={props.url}>
          Découvrir la carte
          <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}
