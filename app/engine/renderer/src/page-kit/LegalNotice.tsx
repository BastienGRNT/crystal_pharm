import type { PharmacyInfo } from '@crystal-pharm/schema';

export function LegalNotice(props: { pharmacy: PharmacyInfo; class?: string }) {
  return (
    <section class={['legal-notice', props.class].filter(Boolean).join(' ')} aria-label="Mentions légales">
      <h2 class="legal-notice__title">Mentions légales</h2>
      <p class="legal-notice__text">
        Site édité par {props.pharmacy.name}, {props.pharmacy.address.street}, {props.pharmacy.address.postalCode}{' '}
        {props.pharmacy.address.city}. Téléphone : {props.pharmacy.phone}.
      </p>
      <p class="legal-notice__text">Site hébergé par la plateforme Crystal Pharm.</p>
    </section>
  );
}
