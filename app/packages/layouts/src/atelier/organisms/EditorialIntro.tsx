import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import type { EnabledModulesProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';

export function EditorialIntro(props: { pharmacy: Readonly<PharmacyInfo>; headline: string; modules: EnabledModulesProps }) {
  return (
    <section class="at-intro">
      <p class="at-intro__kicker">
        Pharmacie · {props.pharmacy.address.city}
        <Show when={props.pharmacy.group}>{(group) => <> · Membre de {group().name}</>}</Show>
      </p>
      <h1 class="at-intro__headline">{props.headline}</h1>
      <p class="at-intro__name">{props.pharmacy.name}</p>
      <div class="at-intro__links">
        <Show when={props.modules.prescriptionUpload}>
          <ArrowLink href="/ordonnance">Envoyer une ordonnance</ArrowLink>
        </Show>
        <Show when={props.modules.team}>
          <ArrowLink href="/equipe">Rencontrer l'équipe</ArrowLink>
        </Show>
      </div>
      <Show when={props.pharmacy.group?.logoUrl}>
        {(groupLogoUrl) => <img class="at-intro__group-logo" src={groupLogoUrl()} alt={`Groupement ${props.pharmacy.group?.name ?? ''}`} />}
      </Show>
    </section>
  );
}
