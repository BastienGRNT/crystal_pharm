import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { GroupBadge } from '../molecules/GroupBadge';

export function SiteFooter(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <footer class="nb-footer">
      <div class="nb-footer__column">
        <strong class="nb-footer__name">{props.pharmacy.name}</strong>
        <Show when={props.pharmacy.group}>{(group) => <GroupBadge group={group()} />}</Show>
      </div>
      <div class="nb-footer__column">
        <span class="nb-footer__title">Contact</span>
        <span>{props.pharmacy.address.street}</span>
        <span>
          {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
        </span>
        <a href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>{props.pharmacy.phone}</a>
      </div>
      <div class="nb-footer__column">
        <span class="nb-footer__title">Liens utiles</span>
        <a href="/">Accueil</a>
        <Show when={props.modules.prescriptionUpload}>
          <a href="/ordonnance">Envoyer une ordonnance</a>
        </Show>
        <a href="/#nous-trouver">Nous trouver</a>
      </div>
    </footer>
  );
}
