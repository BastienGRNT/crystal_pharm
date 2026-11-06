/** La croix d'enseigne : allumée quand la pharmacie est ouverte, éteinte sinon, comme dans la rue. */
export function PharmacyCross(props: { class?: string }) {
  return (
    <svg class={`nb-cross ${props.class ?? ''}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8.5 2h7v6.5H22v7h-6.5V22h-7v-6.5H2v-7h6.5z" />
    </svg>
  );
}
