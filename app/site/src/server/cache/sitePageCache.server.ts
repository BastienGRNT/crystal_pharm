import { LeastRecentlyUsedPageCache, type CachedPage, type CachedPageEntry } from './leastRecentlyUsedPageCache';

const maximumCachedPageCount = 500;
const maximumCachedPageByteCount = 64 * 1024 * 1024;

const cachedPages = new LeastRecentlyUsedPageCache({ maximumEntryCount: maximumCachedPageCount, maximumByteCount: maximumCachedPageByteCount });

// Monte à chaque vidage : une page rendue pendant qu'une notification arrive a lu des
// données déjà périmées, et ne doit pas être gardée (cf. `storePageUnlessEvictedSince`).
let evictionCount = 0;

export function findCachedPage(key: string): CachedPage | undefined {
  return cachedPages.find(key, new Date());
}

export function readEvictionCount(): number {
  return evictionCount;
}

/** Garde la page, sauf si le cache a été vidé depuis `evictionCountBeforeReading` (prise avant de lire la base). */
export function storePageUnlessEvictedSince(evictionCountBeforeReading: number, entry: CachedPageEntry): void {
  if (evictionCount !== evictionCountBeforeReading) return;
  cachedPages.store(entry);
}

export function evictPagesOfTenant(tenantId: string): void {
  evictionCount += 1;
  cachedPages.removeWhere((entry) => entry.tenantId === tenantId);
}

export function evictPagesOfGroup(groupId: string): void {
  evictionCount += 1;
  cachedPages.removeWhere((entry) => entry.groupId === groupId);
}

export function evictAllPages(): void {
  evictionCount += 1;
  cachedPages.clear();
}
