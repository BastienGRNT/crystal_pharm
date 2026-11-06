import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';
import { ArrowLink } from '../atoms/ArrowLink';

const defaultHeadline = 'Prendre soin, simplement.';

export function EditorialIntro(props: HeroSectionProps) {
  return (
    <section class="at-intro">
      <p class="at-intro__kicker">
        Pharmacie · {props.pharmacy.address.city}
        <Show when={props.pharmacy.group}>{(group) => <> · Membre de {group().name}</>}</Show>
      </p>
      <h1 class="at-intro__headline">{props.headline ?? defaultHeadline}</h1>
      <p class="at-intro__name">{props.pharmacy.name}</p>
      <Show when={props.imageUrl}>{(imageUrl) => <img class="at-intro__image" src={imageUrl()} alt="" />}</Show>
      <div class="at-intro__links">
        <ArrowLink href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`}>Appeler la pharmacie</ArrowLink>
        <ArrowLink href="#nous-trouver">Nous trouver</ArrowLink>
      </div>
      <Show when={props.pharmacy.group?.logoUrl}>
        {(groupLogoUrl) => <img class="at-intro__group-logo" src={groupLogoUrl()} alt={`Groupement ${props.pharmacy.group?.name ?? ''}`} />}
      </Show>
    </section>
  );
}
