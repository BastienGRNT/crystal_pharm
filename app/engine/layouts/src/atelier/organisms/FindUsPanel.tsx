import { Show } from 'solid-js';
import type { FindUsSectionProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';
import { SectionTitle } from '../atoms/SectionTitle';

export function FindUsPanel(props: FindUsSectionProps) {
  return (
    <section class="at-section at-find-us" id="nous-trouver">
      <SectionTitle>Nous trouver</SectionTitle>
      <div class="at-section__content at-find-us__content">
        <address class="at-find-us__address">
          {props.address.street}
          <br />
          {props.address.postalCode} {props.address.city}
        </address>
        <p>
          <a href={`tel:${props.phone.replace(/\s/g, '')}`}>{props.phone}</a>
        </p>
        <Show when={props.accessInstructions}>{(instructions) => <p>{instructions()}</p>}</Show>
        <Show when={props.parking}>{(parking) => <p>Stationnement : {parking()}</p>}</Show>
        <Show when={props.publicTransport}>{(publicTransport) => <p>Transports : {publicTransport()}</p>}</Show>
        <ArrowLink href={props.directionsUrl}>Voir l'itinéraire</ArrowLink>
        <Show when={props.mapEmbedUrl}>
          {(mapEmbedUrl) => <iframe class="at-find-us__map" src={mapEmbedUrl()} title={`Carte : ${props.name}`} loading="lazy" />}
        </Show>
      </div>
    </section>
  );
}
