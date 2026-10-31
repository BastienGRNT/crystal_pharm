import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { SectionHeading } from '../atoms/SectionHeading';

export function OnlineOrderSection(props: OnlineOrderModuleProps) {
  return (
    <section class="nb-section nb-online-order" id="commande-en-ligne">
      <div class="nb-online-order__card">
        <SectionHeading eyebrow="Sans vous déplacer" title="Commander en ligne" />
        <p>{props.introduction ?? 'Commandez vos produits en ligne et venez les retirer à la pharmacie.'}</p>
        <ButtonLink href={props.orderPath} variant="primary">
          Accéder à la commande en ligne
        </ButtonLink>
      </div>
    </section>
  );
}
