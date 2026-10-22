import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import type { NeighborhoodSettings } from '../neighborhoodSettingsSchema';
import { NeighborhoodPageTemplate } from '../templates/NeighborhoodPageTemplate';

export default definePage<NeighborhoodSettings>({
  title: 'Envoyer une ordonnance',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'nb-legal-notice' }),
      children: (
        <NeighborhoodPageTemplate pharmacy={props.pharmacy} modules={props.modules}>
          <Show
            when={props.modules.prescriptionUpload}
            fallback={
              <section class="nb-section nb-unavailable">
                <h1>L'envoi d'ordonnance en ligne n'est pas proposé</h1>
                <p>
                  Appelez-nous au <a href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>{props.pharmacy.phone}</a> ou passez directement à
                  la pharmacie.
                </p>
              </section>
            }
          >
            <props.pageKit.Module name="prescriptionUpload" />
          </Show>
        </NeighborhoodPageTemplate>
      ),
    }),
});
