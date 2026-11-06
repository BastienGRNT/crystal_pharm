import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsCard } from '../molecules/NewsCard';

export function NewsSection(props: NewsModuleProps) {
  return (
    <section id="actualites" class="sc-section sc-section--news" aria-labelledby="sc-news-title">
      <SectionHeading id="sc-news-title">Le journal</SectionHeading>
      <div class="sc-news">
        <For each={props.articles}>{(article) => <NewsCard article={article} />}</For>
      </div>
    </section>
  );
}
