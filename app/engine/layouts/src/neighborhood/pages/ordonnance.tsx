import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import { telephoneHref } from '../atoms/telephoneHref';
import type { NeighborhoodSettings } from '../neighborhoodManifest';
import { NeighborhoodPageTemplate } from '../templates/NeighborhoodPageTemplate';

export default definePage<NeighborhoodSettings>({
  title: 'Envoyer une ordonnance',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'nb-legal-notice' }),
      children: (
        <NeighborhoodPageTemplate pharmacy={props.pharmacy} modules={props.modules} openingStatus={props.openingStatus}>
          <Show
            when={props.modules.prescriptionUpload}
            fallback={
              <section class="nb-section nb-unavailable">
                <h1>L’envoi d’ordonnance en ligne n’est pas proposé</h1>
                <p>
                  Appelez-nous au <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a> ou passez directement à la pharmacie.
                </p>
              </section>
            }
          >
            <div class="nb-prescription-page">
              <props.pageKit.Module name="prescriptionUpload" />
              <aside class="nb-prescription-page__aside" aria-label="Comment ça marche">
                <h2 class="nb-panel-title">Comment ça marche</h2>
                <ol class="nb-how">
                  <li>
                    <strong>Vous envoyez</strong> une photo de l’ordonnance.
                  </li>
                  <li>
                    <strong>Nous préparons</strong> vos médicaments, et commandons ce qui manque.
                  </li>
                  <li>
                    <strong>Vous passez</strong> avec l’ordonnance originale : tout est prêt.
                  </li>
                </ol>
                <p class="nb-prescription-page__question">
                  Une question ? <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a>
                </p>
              </aside>
            </div>
          </Show>
        </NeighborhoodPageTemplate>
      ),
    }),
});
