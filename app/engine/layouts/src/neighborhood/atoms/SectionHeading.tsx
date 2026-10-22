export function SectionHeading(props: { eyebrow: string; title: string }) {
  return (
    <header class="nb-section-heading">
      <span class="nb-section-heading__eyebrow">{props.eyebrow}</span>
      <h2 class="nb-section-heading__title">{props.title}</h2>
    </header>
  );
}
