import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { telephoneHref } from '../atoms/telephoneHref';

/** Ce qu'on vient chercher en ouvrant le site : est-ce ouvert, comment appeler, comment venir. */
export function StatusPanel(props: { pharmacy: Readonly<PharmacyInfo>; openingStatus: Accessor<OpeningStatus> }) {
  return (
    <aside class={`ap-today ap-today--${props.openingStatus().state}`} aria-label="En ce moment">
      <span class="ap-today__eyebrow">En ce moment</span>
      <p class="ap-today__status">
        <span class="ap-today__label">{props.openingStatus().label}</span>
        <span class="ap-today__detail">{props.openingStatus().detail}</span>
      </p>
      <div class="ap-today__actions">
        <a class="ap-today__link" href={telephoneHref(props.pharmacy.phone)}>
          <Icon name="phone" />
          {props.pharmacy.phone}
        </a>
        <a class="ap-today__link" href="#nous-trouver">
          <Icon name="pin" />
          Itinéraire
        </a>
        <a class="ap-today__link" href="#horaires">
          Tous les horaires
        </a>
      </div>
    </aside>
  );
}
