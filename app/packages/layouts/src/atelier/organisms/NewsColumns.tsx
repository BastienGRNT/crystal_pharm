import { For } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { SectionTitle } from '../atoms/SectionTitle';
import { NewsTeaser } from '../molecules/NewsTeaser';

export function NewsColumns(props: NewsModuleProps) {
  return (
    <section class="at-section">
      <SectionTitle>Journal</SectionTitle>
      <div class="at-section__content at-news">
        <For each={props.articles}>{(article) => <NewsTeaser article={article} />}</For>
      </div>
    </section>
  );
}
