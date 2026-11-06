/** La croix au trait fin : petite dans l'en-tête, immense en tête de page quand la pharmacie n'a pas de photo. */
export function PharmacyMark(props: { class?: string }) {
  return (
    <svg class={`sc-mark ${props.class ?? ''}`} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M36 4h28v32h32v28H64v32H36V64H4V36h32z" />
      <path d="M40 8h20v32h32v20H60v32H40V60H8V40h32z" />
    </svg>
  );
}
