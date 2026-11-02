import type { JSX } from 'solid-js';

/**
 * L'étiquette de bocal : coins coupés, double filet doré. Chaque couche est une boîte découpée un peu plus petite que
 * la précédente, ce qui dessine les filets sans image ; sans ornements, les coins redeviennent droits.
 */
export function Cartouche(props: { class?: string; children: JSX.Element }) {
  return (
    <div class={`ap-cartouche ${props.class ?? ''}`}>
      <div class="ap-cartouche__paper">
        <div class="ap-cartouche__rule">
          <div class="ap-cartouche__content">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
