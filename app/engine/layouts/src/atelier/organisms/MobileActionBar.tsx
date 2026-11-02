import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';

/** Sur téléphone, appeler, envoyer une ordonnance et venir restent sous le pouce, quelle que soit la page. */
export function MobileActionBar(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <nav class="at-action-bar" aria-label="Actions rapides">
      <a class="at-action-bar__item" href={`tel:${props.pharmacy.phone.replace(/[^\d+]/g, '')}`}>
        Appeler
      </a>
      <Show when={props.modules.prescriptionUpload}>
        <a class="at-action-bar__item at-action-bar__item--main" href="/ordonnance">
          Ordonnance
        </a>
      </Show>
      <a class="at-action-bar__item" href="/#nous-trouver">
        Y aller
      </a>
    </nav>
  );
}
