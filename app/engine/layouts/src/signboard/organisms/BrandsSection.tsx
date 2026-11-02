import { For, Show } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

// Les marques restent des noms, par choix : des logos en couleur casseraient l'ambiance de nuit.
export function BrandsSection(props: BrandsModuleProps) {
  return (
    <section class="sb-section" aria-labelledby="sb-brands-title">
      <SectionHeading id="sb-brands-title">Nos marques</SectionHeading>
      <ul class="sb-brands">
        <For each={props.brands}>
          {(brand) => (
            <li>
              <Show when={brand.url} fallback={<span class="sb-brands__name">{brand.name}</span>}>
                {(url) => (
                  <a class="sb-brands__name" href={url()}>
                    {brand.name}
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
