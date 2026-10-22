import type { PharmacyInfo } from '@crystal-pharm/schema';
import { Show } from 'solid-js';
import { ButtonLink } from '../atoms/ButtonLink';
import { GroupBadge } from '../molecules/GroupBadge';
import { GroupSpotlight } from '../molecules/GroupSpotlight';

export function HeroBanner(props: {
  pharmacy: Readonly<PharmacyInfo>;
  slogan: string;
  heroImageUrl?: string;
  showPrescriptionLink: boolean;
}) {
  return (
    <header class="nb-hero" classList={{ 'nb-hero--with-group': props.pharmacy.group !== undefined }}>
      <div class="nb-hero__text">
        <Show when={props.pharmacy.group}>{(group) => <GroupSpotlight group={group()} />}</Show>
        <h1 class="nb-hero__title">{props.pharmacy.name}</h1>
        <p class="nb-hero__slogan">{props.slogan}</p>
        <div class="nb-hero__actions">
          <Show when={props.showPrescriptionLink}>
            <ButtonLink href="/ordonnance" variant="primary">
              Envoyer une ordonnance
            </ButtonLink>
          </Show>
          <ButtonLink href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`} variant="secondary">
            Appeler le {props.pharmacy.phone}
          </ButtonLink>
        </div>
      </div>
      <div class="nb-hero__visual">
        <Show when={props.heroImageUrl} fallback={<div class="nb-hero__image nb-hero__image--illustration" aria-hidden="true" />}>
          {(heroImageUrl) => <img class="nb-hero__image" src={heroImageUrl()} alt="" />}
        </Show>
        <Show when={props.pharmacy.group}>
          {(group) => (
            <span class="nb-hero__group-stamp">
              <GroupBadge group={group()} />
            </span>
          )}
        </Show>
      </div>
    </header>
  );
}
