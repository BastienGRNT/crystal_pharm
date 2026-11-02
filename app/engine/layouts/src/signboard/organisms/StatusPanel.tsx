import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { telephoneHref } from '../atoms/telephoneHref';

/** L'état d'ouverture en grandes lettres lumineuses, puis de quoi appeler ou venir. */
export function StatusPanel(props: { pharmacy: Readonly<PharmacyInfo>; openingStatus: Accessor<OpeningStatus> }) {
  return (
    <section class={`sb-status sb-status--${props.openingStatus().state}`} aria-label="En ce moment">
      <p class="sb-status__text" aria-live="polite">
        <span class="sb-status__label">{props.openingStatus().label}</span>
        <span class="sb-status__detail">{props.openingStatus().detail}</span>
      </p>
      <div class="sb-status__actions">
        <a class="sb-button sb-button--outline" href={telephoneHref(props.pharmacy.phone)}>
          <Icon name="phone" />
          {props.pharmacy.phone}
        </a>
        <a class="sb-button sb-button--outline" href="#horaires">
          Tous les horaires
        </a>
      </div>
    </section>
  );
}
