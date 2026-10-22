import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionHeading } from '../atoms/SectionHeading';
import { NewsItem } from '../molecules/NewsItem';

export function NewsBlock(props: NewsModuleProps) {
  return (
    <section class="essential-block essential-block--news">
      <SectionHeading>Actualités</SectionHeading>
      <div class="essential-news">
        <For each={props.articles}>{(article) => <NewsItem article={article} />}</For>
      </div>
    </section>
  );
}
