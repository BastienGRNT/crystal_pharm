import { Show } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';

/** L'icône choisie par la pharmacie si elle en a mis une, sinon une petite croix lumineuse. */
export function ServiceLine(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="sb-services__item">
      <Show when={props.service.iconUrl} fallback={<Icon name="plus" class="sb-services__mark" />}>
        {(iconUrl) => <img class="sb-services__icon" src={iconUrl()} alt="" loading="lazy" />}
      </Show>
      <div>
        <h3 class="sb-services__title">{props.service.title}</h3>
        <p class="sb-services__description">{props.service.description}</p>
      </div>
    </li>
  );
}
