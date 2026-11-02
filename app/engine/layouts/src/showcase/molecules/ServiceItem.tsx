import { Show } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';

export function ServiceItem(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="sc-services__item">
      <Show when={props.service.iconUrl}>{(iconUrl) => <img class="sc-services__icon" src={iconUrl()} alt="" loading="lazy" />}</Show>
      <h3 class="sc-services__title">{props.service.title}</h3>
      <p class="sc-services__description">{props.service.description}</p>
    </li>
  );
}
