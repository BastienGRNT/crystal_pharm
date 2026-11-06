import { Show } from 'solid-js';
import type { FindUsSectionProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { SectionHeading } from '../atoms/SectionHeading';
import { telephoneHref } from '../atoms/telephoneHref';

export function FindUsSection(props: FindUsSectionProps) {
  return (
    <section id="nous-trouver" class="sc-section sc-find-us" aria-labelledby="sc-find-us-title">
      <div class="sc-find-us__details">
        <SectionHeading id="sc-find-us-title">Nous trouver</SectionHeading>
        <p class="sc-find-us__address">
          {props.address.street}
          <br />
          {props.address.postalCode} {props.address.city}
        </p>
        <dl class="sc-find-us__facts">
          <div>
            <dt>Téléphone</dt>
            <dd>
              <a href={telephoneHref(props.phone)}>{props.phone}</a>
            </dd>
          </div>
          <Show when={props.email}>
            {(email) => (
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${email()}`}>{email()}</a>
                </dd>
              </div>
            )}
          </Show>
          <Show when={props.accessInstructions}>
            {(accessInstructions) => (
              <div>
                <dt>Accès</dt>
                <dd>{accessInstructions()}</dd>
              </div>
            )}
          </Show>
          <Show when={props.parking}>
            {(parking) => (
              <div>
                <dt>Stationnement</dt>
                <dd>{parking()}</dd>
              </div>
            )}
          </Show>
          <Show when={props.publicTransport}>
            {(publicTransport) => (
              <div>
                <dt>Transports</dt>
                <dd>{publicTransport()}</dd>
              </div>
            )}
          </Show>
        </dl>
        <a class="sc-button sc-button--primary" href={props.directionsUrl}>
          <Icon name="pin" />
          Itinéraire
        </a>
      </div>
      <Show
        when={props.mapEmbedUrl}
        fallback={
          <div class="sc-find-us__map sc-find-us__map--empty" aria-hidden="true">
            <span class="sc-find-us__pin" />
          </div>
        }
      >
        {(mapEmbedUrl) => <iframe class="sc-find-us__map" src={mapEmbedUrl()} title={`Plan d’accès à ${props.name}`} loading="lazy" />}
      </Show>
    </section>
  );
}
