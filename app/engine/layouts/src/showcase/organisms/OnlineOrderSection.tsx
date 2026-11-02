import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function OnlineOrderSection(props: OnlineOrderModuleProps) {
  return (
    <section class="sc-section sc-order" aria-labelledby="sc-order-title">
      <div>
        <h2 class="sc-order__title" id="sc-order-title">
          Commande en ligne
        </h2>
        <p class="sc-order__text">{props.introduction ?? 'Commandez en ligne, retirez à la pharmacie.'}</p>
      </div>
      <a class="sc-button sc-button--primary" href={props.orderPath}>
        <Icon name="basket" />
        Commander
      </a>
    </section>
  );
}
