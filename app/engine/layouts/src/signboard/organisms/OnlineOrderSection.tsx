import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

export function OnlineOrderSection(props: OnlineOrderModuleProps) {
  return (
    <section class="sb-section sb-order" aria-labelledby="sb-order-title">
      <div>
        <h2 class="sb-order__title" id="sb-order-title">
          Commande en ligne
        </h2>
        <p class="sb-order__text">{props.introduction ?? 'Commandez en ligne, retirez à la pharmacie.'}</p>
      </div>
      <a class="sb-button sb-button--signal" href={props.orderPath}>
        <Icon name="basket" />
        Commander
      </a>
    </section>
  );
}
