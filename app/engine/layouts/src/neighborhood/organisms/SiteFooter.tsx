import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { PharmacyCross } from '../atoms/PharmacyCross';
import { telephoneHref } from '../atoms/telephoneHref';
import { GroupBadge } from '../molecules/GroupBadge';

export function SiteFooter(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  return (
    <footer class="nb-footer">
      <div class="nb-footer__inner">
        <div class="nb-footer__identity">
          <PharmacyCross class="nb-footer__mark" />
          <strong class="nb-footer__name">{props.pharmacy.name}</strong>
          <address class="nb-footer__address">
            {props.pharmacy.address.street}
            <br />
            {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
          </address>
          <Show when={props.pharmacy.group}>{(group) => <GroupBadge group={group()} />}</Show>
        </div>
        <div class="nb-footer__column">
          <span class="nb-footer__title">Nous joindre</span>
          <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a>
          <Show when={props.pharmacy.email}>{(email) => <a href={`mailto:${email()}`}>{email()}</a>}</Show>
          <a href="/#nous-trouver">Plan d’accès</a>
        </div>
        <div class="nb-footer__column">
          <span class="nb-footer__title">En ligne</span>
          <Show when={props.modules.prescriptionUpload}>
            <a href="/ordonnance">Envoyer une ordonnance</a>
          </Show>
          <Show when={props.modules.appointment}>
            <a href={props.modules.appointment?.mode === 'externalLink' ? props.modules.appointment.appointmentPath : '/#rendez-vous'}>Prendre rendez-vous</a>
          </Show>
          <Show when={props.modules.onlineOrder}>{(onlineOrder) => <a href={onlineOrder().orderPath}>Commander en ligne</a>}</Show>
          <a href="/#horaires">Horaires</a>
        </div>
        <Show when={props.modules.dutyHotline}>
          {(dutyHotline) => (
            <div class="nb-footer__column">
              <span class="nb-footer__title">La nuit, le dimanche</span>
              <span>Pharmacie de garde la plus proche :</span>
              <a class="nb-footer__hotline" href={`tel:${dutyHotline().phoneNumber}`}>
                {dutyHotline().phoneNumber}
              </a>
            </div>
          )}
        </Show>
      </div>
    </footer>
  );
}
