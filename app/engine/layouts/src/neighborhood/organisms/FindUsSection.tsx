import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import { ButtonLink } from '../atoms/ButtonLink';
import { SectionHeading } from '../atoms/SectionHeading';

export function FindUsSection(props: { pharmacy: Readonly<PharmacyInfo> }) {
  const fullAddress = () => `${props.pharmacy.address.street}, ${props.pharmacy.address.postalCode} ${props.pharmacy.address.city}`;
  return (
    <section class="nb-section nb-find-us" id="nous-trouver">
      <SectionHeading eyebrow="Venir nous voir" title="Trouvez-nous" />
      <div class="nb-find-us__card">
        <div class="nb-find-us__details">
          <p class="nb-find-us__address">
            {props.pharmacy.address.street}
            <br />
            {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
          </p>
          <p>
            Téléphone : <a href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>{props.pharmacy.phone}</a>
          </p>
          <Show when={props.pharmacy.email}>
            {(email) => (
              <p>
                E-mail : <a href={`mailto:${email()}`}>{email()}</a>
              </p>
            )}
          </Show>
          <ButtonLink href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(fullAddress())}`} variant="primary">
            Voir l'itinéraire
          </ButtonLink>
        </div>
        <div class="nb-find-us__map" aria-hidden="true" />
      </div>
    </section>
  );
}
