import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { telephoneHref } from '../atoms/telephoneHref';

/** Sur téléphone, les gestes qu'on vient faire restent sous le pouce, quelle que soit la page. */
export function MobileActionBar(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  const appointmentHref = () => (props.modules.appointment?.mode === 'externalLink' ? props.modules.appointment.appointmentPath : '/#rendez-vous');
  return (
    <nav class="nb-action-bar" aria-label="Actions rapides">
      <a class="nb-action-bar__item" href={telephoneHref(props.pharmacy.phone)}>
        <Icon name="phone" />
        Appeler
      </a>
      <Show when={props.modules.prescriptionUpload}>
        <a class="nb-action-bar__item nb-action-bar__item--main" href="/ordonnance">
          <Icon name="prescription" />
          Ordonnance
        </a>
      </Show>
      <Show when={props.modules.appointment}>
        <a class="nb-action-bar__item" href={appointmentHref()}>
          <Icon name="calendar" />
          Rendez-vous
        </a>
      </Show>
      <a class="nb-action-bar__item" href="/#nous-trouver">
        <Icon name="pin" />
        Y aller
      </a>
    </nav>
  );
}
