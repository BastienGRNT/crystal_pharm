import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceItem } from '../molecules/ServiceItem';

export function ServicesSection(props: ServicesModuleProps) {
  return (
    <section id="services" class="cl-section cl-section--services" aria-labelledby="cl-services-title">
      <SectionHeading id="cl-services-title">Nos services</SectionHeading>
      <ul class="cl-services">
        <For each={props.services}>{(service) => <ServiceItem service={service} />}</For>
      </ul>
    </section>
  );
}
