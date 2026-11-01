import { recordPageViews, type PageViewCount } from '@crystal-pharm/site-traffic-db';
import { readCountedPageView } from './pageViewCounting';
import { PageViewTally } from './pageViewTally';

const writeIntervalInMilliseconds = 30_000;
const maximumPendingEntryCount = 20_000;

const pendingPageViews = new PageViewTally(maximumPendingEntryCount);
let writeTimer: ReturnType<typeof setInterval> | undefined;
let isWriting = false;

/** Compte une page affichée, sans retarder la réponse : l'écriture en base se fait par lots, plus tard. */
export function countPageView(tenantId: string, request: Request, url: URL): void {
  const pageView = readCountedPageView(request, url);
  if (!pageView) return;
  pendingPageViews.add(tenantId, pageView, new Date());
  startWritingPeriodically();
}

function startWritingPeriodically(): void {
  if (writeTimer) return;
  writeTimer = setInterval(() => void writePendingPageViews(), writeIntervalInMilliseconds);
  // Le compteur ne retient jamais le processus : à l'arrêt, au plus 30 s de vues sont perdues.
  writeTimer.unref();
}

async function writePendingPageViews(): Promise<void> {
  if (isWriting) return;
  isWriting = true;
  try {
    for (const countsOfTenant of groupByTenant(pendingPageViews.drain())) await writeCountsOfTenant(countsOfTenant);
  } finally {
    isWriting = false;
  }
}

// Un Tenant à la fois : un échec ne remet que ses vues, sans compter deux fois celles déjà écrites.
// Aucun log : un échec ne dit ni l'adresse ni le chemin, les vues attendent simplement le lot suivant.
async function writeCountsOfTenant(countsOfTenant: PageViewCount[]): Promise<void> {
  try {
    await recordPageViews(countsOfTenant);
  } catch {
    pendingPageViews.restore(countsOfTenant);
  }
}

function groupByTenant(counts: readonly PageViewCount[]): PageViewCount[][] {
  const countsByTenantId = new Map<string, PageViewCount[]>();
  for (const count of counts) countsByTenantId.set(count.tenantId, [...(countsByTenantId.get(count.tenantId) ?? []), count]);
  return [...countsByTenantId.values()];
}
