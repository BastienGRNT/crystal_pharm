import { Show } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';

export function NewsCard(props: { article: NewsModuleProps['articles'][number] }) {
  return (
    <article class="sc-news__card" classList={{ 'sc-news__card--with-image': props.article.imageUrl !== undefined }}>
      <Show when={props.article.imageUrl}>{(imageUrl) => <img class="sc-news__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
      <time class="sc-news__date" datetime={props.article.publishedAt}>
        {props.article.publishedAtLabel}
      </time>
      <div class="sc-news__text">
        <h3 class="sc-news__title">{props.article.title}</h3>
        <p class="sc-news__summary">{props.article.summary}</p>
      </div>
    </article>
  );
}
