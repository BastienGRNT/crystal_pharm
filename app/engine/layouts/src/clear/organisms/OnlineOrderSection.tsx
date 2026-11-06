import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function OnlineOrderSection(props: OnlineOrderModuleProps) {
  return (
    <section class="cl-section cl-order" aria-labelledby="cl-order-title">
      <div>
        <h2 class="cl-order__title" id="cl-order-title">
          Commande en ligne
        </h2>
        <p class="cl-order__text">{props.introduction ?? 'Commandez en ligne, retirez à la pharmacie.'}</p>
      </div>
      <a class="cl-button cl-button--primary" href={props.orderPath}>
        <Icon name="basket" />
        Commander
      </a>
    </section>
  );
}
