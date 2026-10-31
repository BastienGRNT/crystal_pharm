import type { JSX } from 'solid-js';

/** Un en-tête (le nom de la pharmacie en très grand), puis tous les blocs serrés dans une grille. Rien d'autre. */
export function DenseGridTemplate(props: { masthead: JSX.Element; children: JSX.Element }) {
  return (
    <main class="essential">
      {props.masthead}
      <div class="essential-grid">{props.children}</div>
    </main>
  );
}
