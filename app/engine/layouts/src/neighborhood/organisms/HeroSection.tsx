import { Show } from 'solid-js';
import type { HeroSectionProps } from '@crystal-pharm/renderer';
import { ButtonLink } from '../atoms/ButtonLink';
import { GroupBadge } from '../molecules/GroupBadge';
import { GroupSpotlight } from '../molecules/GroupSpotlight';

const defaultHeadline = 'Votre pharmacie de quartier, toujours à votre écoute.';

export function HeroSection(props: HeroSectionProps) {
  return (
    <header class="nb-hero" classList={{ 'nb-hero--with-group': props.pharmacy.group !== undefined }}>
      <div class="nb-hero__text">
        <Show when={props.pharmacy.group}>{(group) => <GroupSpotlight group={group()} />}</Show>
        <h1 class="nb-hero__title">{props.pharmacy.name}</h1>
        <p class="nb-hero__slogan">{props.headline ?? defaultHeadline}</p>
        <div class="nb-hero__actions">
          <ButtonLink href={`tel:${props.pharmacy.phone.replace(/\s/g, '')}`} variant="primary">
            Appeler le {props.pharmacy.phone}
          </ButtonLink>
          <ButtonLink href="#nous-trouver" variant="secondary">
            Nous trouver
          </ButtonLink>
        </div>
      </div>
      <div class="nb-hero__visual">
        <Show when={props.imageUrl} fallback={<div class="nb-hero__image nb-hero__image--illustration" aria-hidden="true" />}>
          {(imageUrl) => <img class="nb-hero__image" src={imageUrl()} alt="" />}
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
