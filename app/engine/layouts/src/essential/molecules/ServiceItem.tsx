import { Show } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';

// Pas d'icône par défaut dans ce layout : seule celle choisie par la pharmacie s'affiche, en noir et blanc.
export function ServiceItem(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="essential-services__item">
      <Show when={props.service.iconUrl}>{(iconUrl) => <img class="essential-services__icon" src={iconUrl()} alt="" loading="lazy" />}</Show>
      <h3 class="essential-services__title">{props.service.title}</h3>
      <p class="essential-services__description">{props.service.description}</p>
    </li>
  );
}
