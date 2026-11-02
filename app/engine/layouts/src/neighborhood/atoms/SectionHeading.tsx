import { Show } from 'solid-js';

export function SectionHeading(props: { eyebrow: string; title: string; introduction?: string }) {
  return (
    <header class="nb-section-heading">
      <span class="nb-section-heading__eyebrow">{props.eyebrow}</span>
      <h2 class="nb-section-heading__title">{props.title}</h2>
      <Show when={props.introduction}>{(introduction) => <p class="nb-section-heading__introduction">{introduction()}</p>}</Show>
    </header>
  );
}
