import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsCard } from '../molecules/NewsCard';

export function NewsSection(props: NewsModuleProps) {
  return (
    <section id="actualites" class="sb-section" aria-labelledby="sb-news-title">
      <SectionHeading id="sb-news-title">Actualités</SectionHeading>
      <div class="sb-news">
        <For each={props.articles}>{(article) => <NewsCard article={article} />}</For>
      </div>
    </section>
  );
}
