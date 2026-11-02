import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceCard } from '../molecules/ServiceCard';

export function ServicesSection(props: ServicesModuleProps) {
  return (
    <section class="nb-section" id="services">
      <SectionHeading eyebrow="Au comptoir" title="Nos services" introduction="Sans rendez-vous, sauf mention contraire. Demandez à l’équipe." />
      <ul class="nb-services">
        <For each={props.services}>{(service) => <ServiceCard service={service} />}</For>
      </ul>
    </section>
  );
}
