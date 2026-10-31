import { Show } from 'solid-js';
import type { FindUsSectionProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { SectionHeading } from '../atoms/SectionHeading';

export function FindUsSection(props: FindUsSectionProps) {
  return (
    <section class="nb-section nb-find-us" id="nous-trouver">
      <SectionHeading eyebrow="Venir nous voir" title="Trouvez-nous" />
      <div class="nb-find-us__card">
        <div class="nb-find-us__details">
          <p class="nb-find-us__address">
            {props.address.street}
            <br />
            {props.address.postalCode} {props.address.city}
          </p>
          <p>
            Téléphone : <a href={`tel:${props.phone.replace(/\s/g, '')}`}>{props.phone}</a>
          </p>
          <Show when={props.accessInstructions}>{(instructions) => <p>{instructions()}</p>}</Show>
          <Show when={props.parking}>{(parking) => <p>Stationnement : {parking()}</p>}</Show>
          <Show when={props.publicTransport}>{(publicTransport) => <p>Transports : {publicTransport()}</p>}</Show>
          <ButtonLink href={props.directionsUrl} variant="primary">
            Voir l'itinéraire
          </ButtonLink>
        </div>
        <Show when={props.mapEmbedUrl} fallback={<div class="nb-find-us__map" aria-hidden="true" />}>
          {(mapEmbedUrl) => (
            <iframe class="nb-find-us__map nb-find-us__map--embedded" src={mapEmbedUrl()} title={`Carte : ${props.name}`} loading="lazy" />
          )}
        </Show>
      </div>
    </section>
  );
}
