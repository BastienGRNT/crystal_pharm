/**
 * La croix de pharmacie en points lumineux, dessinée en CSS : la grille éteinte en fond, deux barres allumées par-dessus.
 * Elle s'éteint quand la pharmacie est fermée (classe posée par le template), comme l'enseigne dans la rue.
 */
export function LedCross(props: { class?: string }) {
  return (
    <span class={`sb-led-cross ${props.class ?? ''}`} aria-hidden="true">
      <span class="sb-led-cross__bar sb-led-cross__bar--vertical" />
      <span class="sb-led-cross__bar sb-led-cross__bar--horizontal" />
    </span>
  );
}
