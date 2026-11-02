import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { Icon } from '../atoms/Icon';
import { LedCross } from '../atoms/LedCross';
import { telephoneHref } from '../atoms/telephoneHref';

/** Les liens vers les sections n'apparaissent que si le module correspondant est activé. */
export function SiteHeader(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <header class="sb-header">
      <div class="sb-header__inner">
        <a class="sb-header__brand" href="/">
          <Show when={props.pharmacy.logoUrl} fallback={<LedCross class="sb-header__mark" />}>
            {(logoUrl) => <img class="sb-header__logo" src={logoUrl()} alt="" />}
          </Show>
          <span class="sb-header__name">{props.pharmacy.name}</span>
        </a>
        <nav class="sb-header__links" aria-label="Navigation principale">
          <ul>
            <li>
              <a href="/#horaires">Horaires</a>
            </li>
            <Show when={props.modules.services}>
              <li>
                <a href="/#services">Services</a>
              </li>
            </Show>
            <Show when={props.modules.appointment?.mode === 'builtIn'}>
              <li>
                <a href="/#rendez-vous">Rendez-vous</a>
              </li>
            </Show>
            <Show when={props.modules.team}>
              <li>
                <a href="/#equipe">Équipe</a>
              </li>
            </Show>
            <Show when={props.modules.news}>
              <li>
                <a href="/#actualites">Actualités</a>
              </li>
            </Show>
            <li>
              <a href="/#nous-trouver">Nous trouver</a>
            </li>
          </ul>
        </nav>
        <a class="sb-button sb-button--outline sb-header__phone" href={telephoneHref(props.pharmacy.phone)}>
          <Icon name="phone" />
          {props.pharmacy.phone}
        </a>
      </div>
    </header>
  );
}
