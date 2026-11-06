import type { OnlineOrderModuleProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';

export function OnlineOrderSection(props: OnlineOrderModuleProps) {
  return (
    <section class="nb-section nb-band" id="commande-en-ligne">
      <div class="nb-band__inner">
        <div class="nb-band__text">
          <span class="nb-section-heading__eyebrow">Sans attendre au comptoir</span>
          <h2 class="nb-band__title">Commander en ligne</h2>
          <p>{props.introduction ?? 'Commandez vos produits en ligne et venez les retirer à la pharmacie.'}</p>
        </div>
        <ButtonLink href={props.orderPath} variant="primary" icon="basket">
          Commander
        </ButtonLink>
      </div>
    </section>
  );
}
