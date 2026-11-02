import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceItem } from '../molecules/ServiceItem';

export function ServicesSection(props: ServicesModuleProps) {
  return (
    <section id="services" class="sc-section sc-section--services" aria-labelledby="sc-services-title">
      <SectionHeading id="sc-services-title">Nos services</SectionHeading>
      <ul class="sc-services">
        <For each={props.services}>{(service) => <ServiceItem service={service} />}</For>
      </ul>
    </section>
  );
}
