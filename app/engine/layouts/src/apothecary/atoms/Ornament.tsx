/** Le fleuron sous les titres : deux filets et un losange. Masqué quand la pharmacie coupe les ornements. */
export function Ornament() {
  return (
    <svg class="ap-ornament" viewBox="0 0 160 12" aria-hidden="true">
      <path class="ap-ornament__rule" d="M0 6h66M94 6h66" />
      <path d="M80 1l5 5-5 5-5-5z" />
      <circle cx="70" cy="6" r="1.6" />
      <circle cx="90" cy="6" r="1.6" />
    </svg>
  );
}
