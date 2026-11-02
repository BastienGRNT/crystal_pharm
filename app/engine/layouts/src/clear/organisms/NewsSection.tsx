import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsCard } from '../molecules/NewsCard';

export function NewsSection(props: NewsModuleProps) {
  return (
    <section id="actualites" class="cl-section cl-section--news" aria-labelledby="cl-news-title">
      <SectionHeading id="cl-news-title">Actualités</SectionHeading>
      <div class="cl-news">
        <For each={props.articles}>{(article) => <NewsCard article={article} />}</For>
      </div>
    </section>
  );
}
