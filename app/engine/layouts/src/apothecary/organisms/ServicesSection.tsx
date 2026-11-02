import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceItem } from '../molecules/ServiceItem';

export function ServicesSection(props: ServicesModuleProps) {
  return (
    <section id="services" class="ap-section ap-section--services" aria-labelledby="ap-services-title">
      <SectionHeading id="ap-services-title">Nos services</SectionHeading>
      <ul class="ap-services">
        <For each={props.services}>{(service) => <ServiceItem service={service} />}</For>
      </ul>
    </section>
  );
}
