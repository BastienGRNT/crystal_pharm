import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { PharmacyMark } from '../atoms/PharmacyMark';
import { telephoneHref } from '../atoms/telephoneHref';

/** Les liens vers les sections n'apparaissent que si le module correspondant est activé. */
export function SiteHeader(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <header class="cl-header">
      <div class="cl-header__inner">
        <a class="cl-header__brand" href="/">
          <Show when={props.pharmacy.logoUrl} fallback={<PharmacyMark />}>
            {(logoUrl) => <img class="cl-header__logo" src={logoUrl()} alt="" />}
          </Show>
          <span class="cl-header__name">{props.pharmacy.name}</span>
        </a>
        <nav class="cl-header__links" aria-label="Navigation principale">
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
        <Show
          when={props.modules.prescriptionUpload}
          fallback={
            <a class="cl-button cl-button--secondary cl-header__action" href={telephoneHref(props.pharmacy.phone)}>
              {props.pharmacy.phone}
            </a>
          }
        >
          <a class="cl-button cl-button--primary cl-header__action" href="/ordonnance">
            Envoyer une ordonnance
          </a>
        </Show>
      </div>
    </header>
  );
}
