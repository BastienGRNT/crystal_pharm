import type { ServicesModuleProps } from '@crystal-pharm/renderer';

export function ServiceLine(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="at-service">
      <h3 class="at-service__title">{props.service.title}</h3>
      <p class="at-service__description">{props.service.description}</p>
    </li>
  );
}
