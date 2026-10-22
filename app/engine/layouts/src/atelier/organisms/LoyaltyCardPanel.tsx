import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';
import { SectionTitle } from '../atoms/SectionTitle';

export function LoyaltyCardPanel(props: LoyaltyCardModuleProps) {
  return (
    <section class="at-section at-loyalty">
      <SectionTitle>Fidélité</SectionTitle>
      <div class="at-section__content at-loyalty__content">
        <p class="at-loyalty__text">{props.text}</p>
        <Show when={props.imageUrl}>{(imageUrl) => <img class="at-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
        <ArrowLink href={props.url}>Obtenir ma carte</ArrowLink>
      </div>
    </section>
  );
}
