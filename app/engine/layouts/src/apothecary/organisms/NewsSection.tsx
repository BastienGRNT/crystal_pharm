import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsCard } from '../molecules/NewsCard';

/** Les actualités en colonnes de journal : « La Gazette » de l'officine. */
export function NewsSection(props: NewsModuleProps) {
  return (
    <section id="actualites" class="ap-section ap-section--news" aria-labelledby="ap-news-title">
      <SectionHeading id="ap-news-title">La Gazette</SectionHeading>
      <div class="ap-news">
        <For each={props.articles}>{(article) => <NewsCard article={article} />}</For>
      </div>
    </section>
  );
}
