import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';

/** Les liens vers les sections n'apparaissent que si le module correspondant est activé. */
export function NavigationBar(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <nav class="nb-navigation" aria-label="Navigation principale">
      <a class="nb-navigation__brand" href="/">
        <Show when={props.pharmacy.logoUrl}>{(logoUrl) => <img class="nb-navigation__logo" src={logoUrl()} alt="" />}</Show>
        <span class="nb-navigation__name">{props.pharmacy.name}</span>
      </a>

      <ul class="nb-navigation__links">
        <li><a href="/#horaires">Horaires</a></li>
        <Show when={props.modules.services}>
          <li><a href="/#services">Services</a></li>
        </Show>
        <Show when={props.modules.team}>
          <li><a href="/#equipe">Équipe</a></li>
        </Show>
        <Show when={props.modules.appointment}>
          <li><a href="/#rendez-vous">Rendez-vous</a></li>
        </Show>
        <Show when={props.modules.onlineOrder}>
          <li><a href="/#commande-en-ligne">Commande en ligne</a></li>
        </Show>
        <Show when={props.modules.loyaltyCard}>
          <li><a href="/#fidelite">Fidélité</a></li>
        </Show>
        <Show when={props.modules.news}>
          <li><a href="/#actualites">Actualités</a></li>
        </Show>
        <li><a href="/#nous-trouver">Nous trouver</a></li>
      </ul>
      <Show when={props.modules.prescriptionUpload}>
        <ButtonLink href="/ordonnance" variant="primary">
          Envoyer une ordonnance
        </ButtonLink>
      </Show>
    </nav>
  );
}
