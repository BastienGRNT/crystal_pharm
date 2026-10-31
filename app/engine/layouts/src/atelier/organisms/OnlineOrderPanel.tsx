import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';
import { SectionTitle } from '../atoms/SectionTitle';

export function OnlineOrderPanel(props: OnlineOrderModuleProps) {
  return (
    <section class="at-section at-online-order">
      <SectionTitle>Commander en ligne</SectionTitle>
      <div class="at-section__content">
        <p>{props.introduction ?? 'Commandez vos produits en ligne et venez les retirer à la pharmacie.'}</p>
        <ArrowLink href={props.orderPath}>Accéder à la commande en ligne</ArrowLink>
      </div>
    </section>
  );
}
