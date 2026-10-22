import type { ServicesModuleProps } from '@crystal-pharm/renderer';

// Pas d'icône dans ce layout : tout passe par la typographie.
export function ServiceItem(props: { service: ServicesModuleProps['services'][number] }) {
  return (
    <li class="essential-services__item">
      <h3 class="essential-services__title">{props.service.title}</h3>
      <p class="essential-services__description">{props.service.description}</p>
    </li>
  );
}
