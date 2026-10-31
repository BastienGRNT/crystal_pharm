import { For, Show } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

export function BrandsSection(props: BrandsModuleProps) {
  return (
    <section class="nb-section nb-brands" id="marques">
      <SectionHeading eyebrow="Nos partenaires" title="Nos marques" />
      <ul class="nb-brands__list">
        <For each={props.brands}>
          {(brand) => (
            <li class="nb-brands__item">
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
    <Show when={props.brand.logoUrl} fallback={<span class="nb-brands__name">{props.brand.name}</span>}>
      {(logoUrl) => <img class="nb-brands__logo" src={logoUrl()} alt={props.brand.name} loading="lazy" />}
    </Show>
  );
}
