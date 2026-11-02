import { Show } from 'solid-js';
import type { FindUsSectionProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { telephoneHref } from '../atoms/telephoneHref';

export function FindUsSection(props: FindUsSectionProps) {
  return (
    <section class="nb-find-us" id="nous-trouver" aria-labelledby="nb-find-us-title">
      <div class="nb-find-us__details">
        <h2 class="nb-panel-title" id="nb-find-us-title">
          Venir à la pharmacie
        </h2>
        <p class="nb-find-us__address">
          {props.address.street}
          <br />
          {props.address.postalCode} {props.address.city}
        </p>
        <dl class="nb-find-us__practical">
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
            {(instructions) => (
              <div>
                <dt>Accès</dt>
                <dd>{instructions()}</dd>
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
        <div class="nb-find-us__actions">
          <ButtonLink href={props.directionsUrl} variant="primary" icon="pin">
            Itinéraire
          </ButtonLink>
          <ButtonLink href={telephoneHref(props.phone)} variant="secondary" icon="phone">
            {props.phone}
          </ButtonLink>
        </div>
      </div>
      <Show when={props.mapEmbedUrl}>
        {(mapEmbedUrl) => <iframe class="nb-find-us__map" src={mapEmbedUrl()} title={`Carte : ${props.name}`} loading="lazy" />}
      </Show>
    </section>
  );
}
