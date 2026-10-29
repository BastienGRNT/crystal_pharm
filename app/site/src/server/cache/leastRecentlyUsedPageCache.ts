/** Une page rendue, prête à être rejouée telle quelle. */
export type CachedPage = {
  status: 200;
  headers: Array<[string, string]>;
  body: string;
};

export type CachedPageEntry = {
  key: string;
  page: CachedPage;
  tenantId: string;
  /** Le groupement dont la page affiche des données, s'il y en a un. */
  groupId: string | undefined;
  expiresAt: Date;
};

type StoredEntry = CachedPageEntry & { byteCount: number };

/**
 * Un cache borné en nombre d'entrées et en octets : quand l'un des deux déborde,
 * la page lue le moins récemment part la première. Une page expirée n'est jamais rendue.
 */
export class LeastRecentlyUsedPageCache {
  // L'ordre d'insertion d'une `Map` est l'ordre d'usage : la première est la moins récente.
  private readonly entries = new Map<string, StoredEntry>();
  private totalByteCount = 0;

  constructor(private readonly limits: { maximumEntryCount: number; maximumByteCount: number }) {}

  get entryCount(): number {
    return this.entries.size;
  }

  find(key: string, now: Date): CachedPage | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= now) {
      this.remove(key);
      return undefined;
    }
    this.entries.delete(key);
    this.entries.set(key, entry);
    return entry.page;
  }

  store(entry: CachedPageEntry): void {
    this.remove(entry.key);
    const byteCount = countBytes(entry.page);
    if (byteCount > this.limits.maximumByteCount) return;
    this.entries.set(entry.key, { ...entry, byteCount });
    this.totalByteCount += byteCount;
    this.evictLeastRecentlyUsedWhileOverLimits();
  }

  removeWhere(shouldRemove: (entry: CachedPageEntry) => boolean): void {
    for (const [key, entry] of this.entries) {
      if (shouldRemove(entry)) this.remove(key);
    }
  }

  clear(): void {
    this.entries.clear();
    this.totalByteCount = 0;
  }

  private remove(key: string): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    this.entries.delete(key);
    this.totalByteCount -= entry.byteCount;
  }

  private evictLeastRecentlyUsedWhileOverLimits(): void {
    while (this.entries.size > this.limits.maximumEntryCount || this.totalByteCount > this.limits.maximumByteCount) {
      const leastRecentlyUsedKey = this.entries.keys().next().value;
      if (leastRecentlyUsedKey === undefined) return;
      this.remove(leastRecentlyUsedKey);
    }
  }
}

function countBytes(page: CachedPage): number {
  const headerLength = page.headers.reduce((total, [name, value]) => total + name.length + value.length, 0);
  return Buffer.byteLength(page.body) + headerLength;
}
