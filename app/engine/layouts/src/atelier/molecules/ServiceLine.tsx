import { Show } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';

export function ServiceLine(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="at-service">
      <Show when={props.service.iconUrl}>{(iconUrl) => <img class="at-service__icon" src={iconUrl()} alt="" loading="lazy" />}</Show>
      <h3 class="at-service__title">{props.service.title}</h3>
      <p class="at-service__description">{props.service.description}</p>
    </li>
  );
}
