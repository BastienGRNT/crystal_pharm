import { For, Show } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';

// Les marques restent des noms, en typographie : des logos de toutes les couleurs casseraient l'unité de la page.
export function BrandsSection(props: BrandsModuleProps) {
  return (
    <section class="sc-section sc-section--brands" aria-labelledby="sc-brands-title">
      <h2 class="sc-brands__title" id="sc-brands-title">
        Nos marques
      </h2>
      <ul class="sc-brands">
        <For each={props.brands}>
          {(brand) => (
            <li class="sc-brands__item">
              <Show when={brand.url} fallback={<span class="sc-brands__name">{brand.name}</span>}>
                {(url) => (
                  <a class="sc-brands__name" href={url()}>
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
