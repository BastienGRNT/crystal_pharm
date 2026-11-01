import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show, type Accessor } from 'solid-js';
import type { EnabledModulesProps, OpeningStatus } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { PharmacyCross } from '../atoms/PharmacyCross';
import { OpeningStatusBadge } from '../molecules/OpeningStatusBadge';

/** Les liens vers les sections n'apparaissent que si le module correspondant est activé. */
export function NavigationBar(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps; openingStatus: Accessor<OpeningStatus> }) {
  return (
    <header class="nb-navigation">
      <div class="nb-navigation__inner">
        <a class="nb-navigation__brand" href="/">
          <Show when={props.pharmacy.logoUrl} fallback={<PharmacyCross class="nb-navigation__mark" />}>
            {(logoUrl) => <img class="nb-navigation__logo" src={logoUrl()} alt="" />}
          </Show>
          <span class="nb-navigation__name">{props.pharmacy.name}</span>
        </a>
        <a class="nb-navigation__status" href="/#horaires" aria-label={`${props.openingStatus().label} ${props.openingStatus().detail}. Voir les horaires`}>
          <OpeningStatusBadge status={props.openingStatus()} />
        </a>
        <nav class="nb-navigation__links" aria-label="Navigation principale">
          <ul>
            <li><a href="/#horaires">Horaires</a></li>
            <Show when={props.modules.services}>
              <li><a href="/#services">Services</a></li>
            </Show>
            <Show when={props.modules.appointment}>
              <li><a href="/#rendez-vous">Rendez-vous</a></li>
            </Show>
            <Show when={props.modules.team}>
              <li><a href="/#equipe">Équipe</a></li>
            </Show>
            <Show when={props.modules.news}>
              <li><a href="/#actualites">Actualités</a></li>
            </Show>
            <li><a href="/#nous-trouver">Accès</a></li>
          </ul>
        </nav>
        <Show when={props.modules.prescriptionUpload}>
          <span class="nb-navigation__action">
            <ButtonLink href="/ordonnance" variant="primary" icon="prescription">
              Envoyer une ordonnance
            </ButtonLink>
          </span>
        </Show>
      </div>
    </header>
  );
}
