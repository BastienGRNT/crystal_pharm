import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

export function OnlineOrderBlock(props: OnlineOrderModuleProps) {
  return (
    <section class="essential-block essential-block--online-order">
      <SectionHeading>Commande en ligne</SectionHeading>
      <p>{props.introduction ?? 'Commandez en ligne, retirez à la pharmacie.'}</p>
      <a class="essential-link" href={props.orderPath}>
        → Commander
      </a>
    </section>
  );
}
