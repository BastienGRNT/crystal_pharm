import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsCard } from '../molecules/NewsCard';

export function NewsSection(props: NewsModuleProps) {
  return (
    <section class="nb-section" id="actualites">
      <SectionHeading eyebrow="À la pharmacie" title="Actualités" />
      <div class="nb-news">
        <For each={props.articles}>{(article, index) => <NewsCard article={article} isFeatured={index() === 0} />}</For>
      </div>
    </section>
  );
}
