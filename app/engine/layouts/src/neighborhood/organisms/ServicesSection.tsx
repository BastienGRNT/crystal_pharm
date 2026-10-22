import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceCard } from '../molecules/ServiceCard';

export function ServicesSection(props: ServicesModuleProps) {
  return (
    <section class="nb-section" id="services">
      <SectionHeading eyebrow="Au comptoir" title="Nos services" />
      <ul class="nb-card-grid">
        <For each={props.services}>{(service) => <ServiceCard service={service} />}</For>
      </ul>
    </section>
  );
}
