import { Show } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';

export function NewsTeaser(props: { article: NewsModuleProps['articles'][number] }) {
  return (
    <article class="at-news__article" classList={{ 'at-news__article--text-only': props.article.imageUrl === undefined }}>
      <Show when={props.article.imageUrl} fallback={<span class="at-news__quote" aria-hidden="true">“</span>}>
        {(imageUrl) => <img class="at-news__image" src={imageUrl()} alt="" loading="lazy" />}
      </Show>
      <time class="at-news__date" datetime={props.article.publishedAt}>
        {props.article.publishedAtLabel}
      </time>
      <h3 class="at-news__title">{props.article.title}</h3>
      <p class="at-news__summary">{props.article.summary}</p>
    </article>
  );
}
