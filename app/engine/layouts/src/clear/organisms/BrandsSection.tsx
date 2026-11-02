import { For, Show } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';

// Les marques restent des noms, en typographie : des logos de toutes les couleurs casseraient l'unité de la page.
export function BrandsSection(props: BrandsModuleProps) {
  return (
    <section class="cl-section cl-section--brands" aria-labelledby="cl-brands-title">
      <h2 class="cl-brands__title" id="cl-brands-title">
        Nos marques
      </h2>
      <ul class="cl-brands">
        <For each={props.brands}>
          {(brand) => (
            <li class="cl-brands__item">
              <Show when={brand.url} fallback={<span class="cl-brands__name">{brand.name}</span>}>
                {(url) => (
                  <a class="cl-brands__name" href={url()}>
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
