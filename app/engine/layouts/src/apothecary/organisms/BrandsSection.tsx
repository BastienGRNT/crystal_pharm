import { For, Show } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';

// Les marques restent des noms, en typographie : des logos de toutes les couleurs casseraient l'unité de la page.
export function BrandsSection(props: BrandsModuleProps) {
  return (
    <section class="ap-section ap-section--brands" aria-labelledby="ap-brands-title">
      <h2 class="ap-brands__title" id="ap-brands-title">
        Nos marques
      </h2>
      <ul class="ap-brands">
        <For each={props.brands}>
          {(brand) => (
            <li class="ap-brands__item">
              <Show when={brand.url} fallback={<span class="ap-brands__name">{brand.name}</span>}>
                {(url) => (
                  <a class="ap-brands__name" href={url()}>
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
