import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import type { AtelierSettings } from '../atelierManifest';
import { AsymmetricGridTemplate } from '../templates/AsymmetricGridTemplate';

export default definePage<AtelierSettings>({
  title: 'Envoyer une ordonnance',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'at-legal-notice' }),
      children: (
        <AsymmetricGridTemplate pharmacy={props.pharmacy} modules={props.modules} accentTone={props.settings.accentTone} currentPath="/ordonnance">
          <Show
            when={props.modules.prescriptionUpload}
            fallback={
              <p class="at-unavailable">
                L'envoi d'ordonnance en ligne n'est pas proposé. Appelez-nous au{' '}
                <a href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>{props.pharmacy.phone}</a>.
              </p>
            }
          >
            <props.pageKit.Module name="prescriptionUpload" />
          </Show>
        </AsymmetricGridTemplate>
      ),
    }),
});
