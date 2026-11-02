import type { JSX } from 'solid-js';

/** Un en-tête (le nom de la pharmacie en très grand), l'état d'ouverture, puis tous les blocs serrés dans une grille. Rien d'autre. */
export function DenseGridTemplate(props: { masthead: JSX.Element; status: JSX.Element; actionBar: JSX.Element; children: JSX.Element }) {
  return (
    <main class="essential">
      {props.masthead}
      {props.status}
      <div class="essential-grid">{props.children}</div>
      {props.actionBar}
    </main>
  );
}
