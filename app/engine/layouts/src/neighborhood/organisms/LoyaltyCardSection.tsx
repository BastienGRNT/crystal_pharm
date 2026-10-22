import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { SectionHeading } from '../atoms/SectionHeading';

export function LoyaltyCardSection(props: LoyaltyCardModuleProps) {
  return (
    <section class="nb-section nb-loyalty" id="fidelite">
      <div class="nb-loyalty__card" classList={{ 'nb-loyalty__card--text-only': props.imageUrl === undefined }}>
        <Show when={props.imageUrl}>{(imageUrl) => <img class="nb-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
        <div class="nb-loyalty__content">
          <SectionHeading eyebrow="Vos avantages" title="Carte de fidélité" />
          <p class="nb-loyalty__text">{props.text}</p>
          <ButtonLink href={props.url} variant="primary">
            Obtenir ma carte
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
