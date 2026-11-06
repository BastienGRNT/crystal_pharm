import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { telephoneHref } from '../atoms/telephoneHref';

/** Sur téléphone, les gestes qu'on vient faire restent sous le pouce, quelle que soit la page. */
export function MobileActionBar(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <nav class="sc-action-bar" aria-label="Actions rapides">
      <a class="sc-action-bar__item" href={telephoneHref(props.pharmacy.phone)}>
        <Icon name="phone" />
        <span class="sc-action-bar__label">Appeler</span>
      </a>
      <Show when={props.modules.prescriptionUpload}>
        <a class="sc-action-bar__item sc-action-bar__item--main" href="/ordonnance">
          <Icon name="prescription" />
          <span class="sc-action-bar__label">Ordonnance</span>
        </a>
      </Show>
      <a class="sc-action-bar__item" href="/#nous-trouver">
        <Icon name="pin" />
        <span class="sc-action-bar__label">Itinéraire</span>
      </a>
    </nav>
  );
}
