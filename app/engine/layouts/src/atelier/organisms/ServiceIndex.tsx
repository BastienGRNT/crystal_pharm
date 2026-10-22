import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { ServiceLine } from '../molecules/ServiceLine';

export function ServiceIndex(props: ServicesModuleProps) {
  return (
    <section class="at-section">
      <SectionTitle>Services</SectionTitle>
      <ul class="at-section__content at-services">
        <For each={props.services}>{(service) => <ServiceLine service={service} />}</For>
      </ul>
    </section>
  );
}
