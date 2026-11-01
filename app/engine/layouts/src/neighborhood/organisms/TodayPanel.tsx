import type { PharmacyInfo } from '@crystal-pharm/schema';
import type { Accessor } from 'solid-js';
import type { OpeningStatus } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { telephoneHref } from '../atoms/telephoneHref';
import { OpeningStatusBadge } from '../molecules/OpeningStatusBadge';

/** Ce qu'on vient chercher en ouvrant le site : est-ce ouvert, comment appeler, comment venir. */
export function TodayPanel(props: { pharmacy: Readonly<PharmacyInfo>; openingStatus: Accessor<OpeningStatus> }) {
  return (
    <aside class="nb-today" aria-label="Aujourd’hui">
      <span class="nb-today__eyebrow">En ce moment</span>
      <OpeningStatusBadge status={props.openingStatus()} size="large" />
      <div class="nb-today__actions">
        <ButtonLink href={telephoneHref(props.pharmacy.phone)} variant="inverted" icon="phone">
          {props.pharmacy.phone}
        </ButtonLink>
        <ButtonLink href="#nous-trouver" variant="secondary" icon="pin">
          Venir à la pharmacie
        </ButtonLink>
      </div>
      <a class="nb-today__hours-link" href="#horaires">
        Tous les horaires de la semaine
      </a>
    </aside>
  );
}
