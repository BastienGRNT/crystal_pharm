import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsCard } from '../molecules/NewsCard';

export function NewsSection(props: NewsModuleProps) {
  return (
    <section class="nb-section" id="actualites">
      <SectionHeading eyebrow="Du nouveau" title="Actualités" />
      <div class="nb-card-grid">
        <For each={props.articles}>{(article) => <NewsCard article={article} />}</For>
      </div>
    </section>
  );
}
