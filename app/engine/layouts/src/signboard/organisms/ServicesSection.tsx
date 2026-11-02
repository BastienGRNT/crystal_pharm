import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceLine } from '../molecules/ServiceLine';

export function ServicesSection(props: ServicesModuleProps) {
  return (
    <section id="services" class="sb-section" aria-labelledby="sb-services-title">
      <SectionHeading id="sb-services-title">Services</SectionHeading>
      <ul class="sb-services">
        <For each={props.services}>{(service) => <ServiceLine service={service} />}</For>
      </ul>
    </section>
  );
}
