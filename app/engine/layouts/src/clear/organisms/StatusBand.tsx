import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';
import { telephoneHref } from '../atoms/telephoneHref';

/** En haut de chaque page, avant tout le reste : est-ce ouvert, et comment joindre la pharmacie. */
export function StatusBand(props: { pharmacy: Readonly<PharmacyInfo>; openingStatus: Accessor<OpeningStatus> }) {
  return (
    <div class={`cl-status-band cl-status-band--${props.openingStatus().state}`}>
      <div class="cl-status-band__inner">
        <p class="cl-status-band__status" aria-live="polite">
          <span class="cl-status-band__dot" aria-hidden="true" />
          <span class="cl-status-band__label">{props.openingStatus().label}</span>
          <span class="cl-status-band__detail">{props.openingStatus().detail}</span>
        </p>
        <p class="cl-status-band__contact">
          <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a>
          <span>
            {props.pharmacy.address.street}, {props.pharmacy.address.city}
          </span>
        </p>
      </div>
    </div>
  );
}
