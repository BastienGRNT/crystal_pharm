import { Show } from 'solid-js';
import type { NewsModuleProps } from '@crystal-pharm/renderer';

/** Sans image, l'article reste un article : on ne remplit pas le vide avec un motif. */
export function NewsCard(props: { article: NewsModuleProps['articles'][number]; isFeatured: boolean }) {
  return (
    <article class="nb-news-card" classList={{ 'nb-news-card--featured': props.isFeatured, 'nb-news-card--with-image': props.article.imageUrl !== undefined }}>
      <Show when={props.article.imageUrl}>{(imageUrl) => <img class="nb-news-card__image" src={imageUrl()} alt="" loading="lazy" />}</Show>
      <div class="nb-news-card__body">
        <time class="nb-news-card__date" datetime={props.article.publishedAt}>
          {props.article.publishedAtLabel}
        </time>
        <h3 class="nb-news-card__title">{props.article.title}</h3>
        <p class="nb-news-card__summary">{props.article.summary}</p>
      </div>
    </article>
  );
}
