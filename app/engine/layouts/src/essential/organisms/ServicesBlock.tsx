import { For } from 'solid-js';
import type { ServicesModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { ServiceItem } from '../molecules/ServiceItem';

export function ServicesBlock(props: ServicesModuleProps) {
  return (
    <section class="essential-block essential-block--services">
      <SectionHeading>Services</SectionHeading>
      <ul class="essential-services">
        <For each={props.services}>{(service) => <ServiceItem service={service} />}</For>
      </ul>
    </section>
  );
}
