import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { ServiceIcon } from '../atoms/ServiceIcon';

export function ServiceCard(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="nb-service-card">
      <ServiceIcon name={props.service.iconName} />
      <h3 class="nb-service-card__title">{props.service.title}</h3>
      <p class="nb-service-card__description">{props.service.description}</p>
    </li>
  );
}
