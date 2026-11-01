import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';

export function LoyaltyCardSection(props: LoyaltyCardModuleProps) {
  return (
    <section class="nb-section nb-band" id="fidelite">
      <div class="nb-band__inner">
        <Show when={props.imageUrl}>{(imageUrl) => <img class="nb-band__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
        <div class="nb-band__text">
          <span class="nb-section-heading__eyebrow">Vos avantages</span>
          <h2 class="nb-band__title">Carte de fidélité</h2>
          <p>{props.text}</p>
        </div>
        <ButtonLink href={props.url} variant="primary">
          Obtenir ma carte
        </ButtonLink>
      </div>
    </section>
  );
}
