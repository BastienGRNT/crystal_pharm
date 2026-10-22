import { Show } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';

export function NewsItem(props: { article: NewsModuleProps['articles'][number] }) {
  return (
    <article class="essential-news__article" classList={{ 'essential-news__article--with-image': props.article.imageUrl !== undefined }}>
      <Show when={props.article.imageUrl}>
        {(imageUrl) => <img class="essential-news__image" src={imageUrl()} alt="" loading="lazy" />}
      </Show>
      <div class="essential-news__text">
        <time class="essential-news__date" datetime={props.article.publishedAt}>
          {props.article.publishedAtLabel}
        </time>
        <h3 class="essential-news__title">{props.article.title}</h3>
        <p class="essential-news__summary">{props.article.summary}</p>
      </div>
    </article>
  );
}
