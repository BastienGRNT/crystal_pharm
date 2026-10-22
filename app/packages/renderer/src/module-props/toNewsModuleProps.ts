import type { NewsModuleData } from '@crystal-pharm/schema';
import { formatInParisTimeZone } from './formatInParisTimeZone';

export type NewsModuleProps = {
  /** Du plus récent au plus ancien. */
  articles: Array<{
    title: string;
    summary: string;
    imageUrl?: string;
    /** Date ISO, pour l'attribut `datetime` de `<time>`. */
    publishedAt: string;
    /** Par exemple « 12 mars 2026 ». */
    publishedAtLabel: string;
  }>;
};

export function toNewsModuleProps(data: NewsModuleData): NewsModuleProps {
  return {
    articles: data.articles
      .toSorted((first, second) => second.publishedAt.localeCompare(first.publishedAt))
      .map((article) => ({
        ...article,
        // Midi UTC : la date reste la même quel que soit le fuseau horaire.
        publishedAtLabel: formatInParisTimeZone(new Date(`${article.publishedAt}T12:00:00Z`), { dateStyle: 'long' }),
      })),
  };
}
