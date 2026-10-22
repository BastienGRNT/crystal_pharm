import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { SideNavigationLink } from '../molecules/SideNavigationLink';

export type AtelierPagePath = '/' | '/equipe' | '/ordonnance';

/** Colonne fixe à gauche sur grand écran, simple bandeau en haut sur mobile. */
export function SideHeader(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps; currentPath: AtelierPagePath }) {
  return (
    <header class="at-side">
      <a class="at-side__brand" href="/">
        <Show when={props.pharmacy.logoUrl}>{(logoUrl) => <img class="at-side__logo" src={logoUrl()} alt="" />}</Show>
        <span class="at-side__name">{props.pharmacy.name}</span>
      </a>
      <nav class="at-side__navigation" aria-label="Navigation principale">
        <SideNavigationLink href="/" label="Accueil" isCurrent={props.currentPath === '/'} />
        <Show when={props.modules.team}>
          <SideNavigationLink href="/equipe" label="L'équipe" isCurrent={props.currentPath === '/equipe'} />
        </Show>
        <Show when={props.modules.prescriptionUpload}>
          <SideNavigationLink href="/ordonnance" label="Ordonnance" isCurrent={props.currentPath === '/ordonnance'} />
        </Show>
      </nav>
      <address class="at-side__contact">
        <span>{props.pharmacy.address.street}</span>
        <span>
          {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
        </span>
        <a href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>{props.pharmacy.phone}</a>
      </address>
    </header>
  );
}
