import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';

/** Sur téléphone, les trois gestes qu'on vient faire restent sous le pouce. */
export function MobileActionBar(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <nav class="essential-action-bar" aria-label="Actions rapides">
      <a class="essential-action-bar__item" href={`tel:${props.pharmacy.phone.replace(/[^\d+]/g, '')}`}>
        Appeler
      </a>
      <Show when={props.modules.prescriptionUpload}>
        <a class="essential-action-bar__item essential-action-bar__item--main" href="#ordonnance">
          Ordonnance
        </a>
      </Show>
      <a class="essential-action-bar__item" href="#nous-trouver">
        Y aller
      </a>
    </nav>
  );
}
