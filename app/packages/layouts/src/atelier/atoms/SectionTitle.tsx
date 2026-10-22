/** Le numéro (01, 02…) est calculé en CSS : il reste juste quand un module est désactivé. */
export function SectionTitle(props: { children: string }) {
  return (
    <header class="at-section__header">
      <span class="at-section__number" aria-hidden="true" />
      <h2 class="at-section__title">{props.children}</h2>
    </header>
  );
}
