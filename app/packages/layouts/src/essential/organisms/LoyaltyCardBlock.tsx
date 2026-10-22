import { Show } from 'solid-js';
import type { LoyaltyCardModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

export function LoyaltyCardBlock(props: LoyaltyCardModuleProps) {
  return (
    <section class="essential-block essential-loyalty">
      <SectionHeading>Carte de fidélité</SectionHeading>
      <Show when={props.imageUrl}>{(imageUrl) => <img class="essential-loyalty__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
      <p class="essential-loyalty__text">{props.text}</p>
      <a class="essential-loyalty__link" href={props.url}>
        → Obtenir ma carte
      </a>
    </section>
  );
}
