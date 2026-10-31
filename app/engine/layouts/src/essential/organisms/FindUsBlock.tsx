import { Show } from 'solid-js';
import type { FindUsSectionProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

export function FindUsBlock(props: FindUsSectionProps) {
  return (
    <section class="essential-block essential-block--find-us">
      <SectionHeading>Nous trouver</SectionHeading>
      <p>{props.addressLabel}</p>
      <p>
        <a href={`tel:${props.phone.replace(/\s/g, '')}`}>{props.phone}</a>
      </p>
      <Show when={props.accessInstructions}>{(instructions) => <p>{instructions()}</p>}</Show>
      <Show when={props.parking}>{(parking) => <p>Stationnement : {parking()}</p>}</Show>
      <Show when={props.publicTransport}>{(publicTransport) => <p>Transports : {publicTransport()}</p>}</Show>
      <a class="essential-link" href={props.directionsUrl}>
        → Itinéraire
      </a>
    </section>
  );
}
