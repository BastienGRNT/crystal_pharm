import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import type { ShowcaseSettings } from '../showcaseManifest';
import { telephoneHref } from '../atoms/telephoneHref';
import { ShowcasePageTemplate } from '../templates/ShowcasePageTemplate';

export default definePage<ShowcaseSettings>({
  title: 'Envoyer une ordonnance',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'sc-legal-notice' }),
      children: (
        <ShowcasePageTemplate pharmacy={props.pharmacy} modules={props.modules} openingStatus={props.openingStatus} settings={props.settings}>
          <Show
            when={props.modules.prescriptionUpload}
            fallback={
              <section class="sc-section sc-unavailable">
                <h1 class="sc-heading">L’envoi d’ordonnance en ligne n’est pas proposé</h1>
                <p>
                  Appelez-nous au <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a> ou passez directement à la pharmacie.
                </p>
              </section>
            }
          >
            <div class="sc-prescription-page">
              <props.pageKit.Module name="prescriptionUpload" />
              <aside class="sc-prescription-page__aside" aria-label="Comment ça marche">
                <h2 class="sc-prescription-page__aside-title">Comment ça marche</h2>
                <ol class="sc-how">
                  <li>
                    <strong>Vous envoyez</strong> une photo de l’ordonnance.
                  </li>
                  <li>
                    <strong>Nous préparons</strong> vos médicaments et commandons ce qui manque.
                  </li>
                  <li>
                    <strong>Vous passez</strong> avec l’ordonnance originale : tout est prêt.
                  </li>
                </ol>
                <p>
                  Une question ? <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a>
                </p>
              </aside>
            </div>
          </Show>
        </ShowcasePageTemplate>
      ),
    }),
});
