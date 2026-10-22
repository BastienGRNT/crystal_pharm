import type { NewsModuleProps } from '@crystal-pharm/renderer';
import { CardImage } from '../atoms/CardImage';

export function NewsCard(props: { article: NewsModuleProps['articles'][number] }) {
  return (
    <article class="nb-news-card">
      <CardImage imageUrl={props.article.imageUrl} />
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
