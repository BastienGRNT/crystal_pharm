import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function OnlineOrderSection(props: OnlineOrderModuleProps) {
  return (
    <section class="ap-section ap-order" aria-labelledby="ap-order-title">
      <div>
        <h2 class="ap-order__title" id="ap-order-title">
          Commande en ligne
        </h2>
        <p class="ap-order__text">{props.introduction ?? 'Commandez en ligne, retirez à la pharmacie.'}</p>
      </div>
      <a class="ap-button ap-button--primary" href={props.orderPath}>
        <Icon name="basket" />
        Commander
      </a>
    </section>
  );
}
