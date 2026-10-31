import { For } from 'solid-js';
import type { BrandsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';

// Pas de logos dans ce layout, par choix : les marques restent des noms, en typographie.
export function BrandsBlock(props: BrandsModuleProps) {
  return (
    <section class="essential-block essential-block--brands">
      <SectionHeading>Marques</SectionHeading>
      <ul class="essential-brands">
        <For each={props.brands}>{(brand) => <li>{brand.name}</li>}</For>
      </ul>
    </section>
  );
}
