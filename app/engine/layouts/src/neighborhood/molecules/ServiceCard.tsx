import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { ServiceIcon } from '../atoms/ServiceIcon';

export function ServiceCard(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="nb-service">
      <ServiceIcon name={props.service.iconName} imageUrl={props.service.iconUrl} />
      <div>
        <h3 class="nb-service__title">{props.service.title}</h3>
        <p class="nb-service__description">{props.service.description}</p>
      </div>
    </li>
  );
}
