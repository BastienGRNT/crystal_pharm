import { Show } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';

export function ServiceItem(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="cl-services__item">
      <Show when={props.service.iconUrl}>{(iconUrl) => <img class="cl-services__icon" src={iconUrl()} alt="" loading="lazy" />}</Show>
      <h3 class="cl-services__title">{props.service.title}</h3>
      <p class="cl-services__description">{props.service.description}</p>
    </li>
  );
}
