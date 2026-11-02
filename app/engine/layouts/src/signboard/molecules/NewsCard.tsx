import { Show } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';

export function NewsCard(props: { article: NewsModuleProps['articles'][number] }) {
  return (
    <article class="sb-news__card">
      <Show when={props.article.imageUrl}>{(imageUrl) => <img class="sb-news__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
      <time class="sb-news__date" datetime={props.article.publishedAt}>
        {props.article.publishedAtLabel}
      </time>
      <h3 class="sb-news__title">{props.article.title}</h3>
      <p class="sb-news__summary">{props.article.summary}</p>
    </article>
  );
}
