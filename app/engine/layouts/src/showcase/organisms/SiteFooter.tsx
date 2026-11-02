import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { telephoneHref } from '../atoms/telephoneHref';

export function SiteFooter(props: { pharmacy: Readonly<PharmacyInfo>; modules: EnabledModulesProps }) {
  const appointmentHref = () => (props.modules.appointment?.mode === 'externalLink' ? props.modules.appointment.appointmentPath : '/#rendez-vous');
  return (
    <footer class="sc-footer">
      <div class="sc-footer__inner">
        <div class="sc-footer__identity">
          <strong class="sc-footer__name">{props.pharmacy.name}</strong>
          <span>
            {props.pharmacy.address.street}, {props.pharmacy.address.postalCode} {props.pharmacy.address.city}
          </span>
          <a href={telephoneHref(props.pharmacy.phone)}>{props.pharmacy.phone}</a>
          <Show when={props.pharmacy.email}>{(email) => <a href={`mailto:${email()}`}>{email()}</a>}</Show>
          <Show when={props.pharmacy.group}>{(group) => <span>Membre du groupement {group().name}</span>}</Show>
        </div>
        <nav class="sc-footer__links" aria-label="Pied de page">
          <Show when={props.modules.prescriptionUpload}>
            <a href="/ordonnance">Envoyer une ordonnance</a>
          </Show>
          <Show when={props.modules.appointment}>
            <a href={appointmentHref()}>Prendre rendez-vous</a>
          </Show>
          <Show when={props.modules.onlineOrder}>{(onlineOrder) => <a href={onlineOrder().orderPath}>Commander en ligne</a>}</Show>
          <a href="/#horaires">Horaires</a>
          <a href="/#nous-trouver">Nous trouver</a>
        </nav>
      </div>
    </footer>
  );
}
