import { Show } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { Cartouche } from './Cartouche';

/** Un tiroir d'apothicaire : la plaque avec le nom du service, le bouton en laiton, puis sa description. */
export function ServiceItem(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="ap-services__item ap-drawer">
      <Cartouche class="ap-cartouche--small ap-drawer__plate">
        <h3 class="ap-drawer__title">{props.service.title}</h3>
      </Cartouche>
      <span class="ap-drawer__knob" aria-hidden="true" />
      <Show when={props.service.iconUrl}>{(iconUrl) => <img class="ap-drawer__icon" src={iconUrl()} alt="" loading="lazy" />}</Show>
      <p class="ap-drawer__description">{props.service.description}</p>
    </li>
  );
}
