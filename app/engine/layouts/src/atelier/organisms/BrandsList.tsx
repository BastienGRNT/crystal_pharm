import { For, Show } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';

export function BrandsList(props: BrandsModuleProps) {
  return (
    <section class="at-section at-brands">
      <SectionTitle>Nos marques</SectionTitle>
      <ul class="at-section__content at-brands__list">
        <For each={props.brands}>
          {(brand) => (
            <li class="at-brands__item">
              <Show when={brand.url} fallback={<BrandLabel brand={brand} />}>
                {(url) => (
                  <a href={url()} rel="noopener">
                    <BrandLabel brand={brand} />
                  </a>
                )}
              </Show>
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}

function BrandLabel(props: { brand: BrandsModuleProps['brands'][number] }) {
  return (
    <Show when={props.brand.logoUrl} fallback={<span class="at-brands__name">{props.brand.name}</span>}>
      {(logoUrl) => <img class="at-brands__logo" src={logoUrl()} alt={props.brand.name} loading="lazy" />}
    </Show>
  );
}
