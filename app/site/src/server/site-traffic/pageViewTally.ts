import type { PageViewCount } from '@crystal-pharm/site-traffic-db';
import type { CountedPageView } from './pageViewCounting';

const hourInMilliseconds = 60 * 60 * 1000;

/**
 * Les vues additionnées en mémoire, par Tenant, heure et page, en attendant d'être écrites.
 * Bornée : si la base reste injoignable, les nouvelles pages ne sont plus comptées plutôt que de remplir la mémoire.
 */
export class PageViewTally {
  private readonly countsByKey = new Map<string, PageViewCount>();

  constructor(private readonly maximumEntryCount: number) {}

  add(tenantId: string, pageView: CountedPageView, viewedAt: Date): void {
    const hourStart = new Date(Math.floor(viewedAt.getTime() / hourInMilliseconds) * hourInMilliseconds);
    this.addCount({ tenantId, hourStart, pagePath: pageView.pagePath, viewCount: 1, visitCount: pageView.isStartOfVisit ? 1 : 0 });
  }

  /** Rend les vues additionnées et repart de zéro. */
  drain(): PageViewCount[] {
    const counts = [...this.countsByKey.values()];
    this.countsByKey.clear();
    return counts;
  }

  /** Remet des vues qui n'ont pas pu être écrites, pour la prochaine fois. */
  restore(counts: readonly PageViewCount[]): void {
    for (const count of counts) this.addCount(count);
  }

  private addCount(count: PageViewCount): void {
    const key = `${count.tenantId}|${count.hourStart.toISOString()}|${count.pagePath}`;
    const existingCount = this.countsByKey.get(key);
    if (existingCount) {
      existingCount.viewCount += count.viewCount;
      existingCount.visitCount += count.visitCount;
      return;
    }
    if (this.countsByKey.size >= this.maximumEntryCount) return;
    this.countsByKey.set(key, { ...count });
  }
}
