import { describe, expect, it } from 'vitest';
import { LeastRecentlyUsedPageCache, type CachedPageEntry } from './leastRecentlyUsedPageCache';

const now = new Date('2026-10-28T10:00:00Z');
const later = new Date('2026-10-28T11:00:00Z');

function entryOf(key: string, overrides: Partial<CachedPageEntry> & { body?: string } = {}): CachedPageEntry {
  const { body = 'x', ...rest } = overrides;
  return { key, page: { status: 200, headers: [], body }, tenantId: 'tenant-1', groupId: undefined, expiresAt: later, ...rest };
}

describe('LeastRecentlyUsedPageCache', () => {
  it('rend la page gardée, et rien pour une clé inconnue', () => {
    const cache = new LeastRecentlyUsedPageCache({ maximumEntryCount: 10, maximumByteCount: 1000 });
    cache.store(entryOf('a/'));

    expect(cache.find('a/', now)?.body).toBe('x');
    expect(cache.find('b/', now)).toBeUndefined();
  });

  it('chasse d’abord la page lue le moins récemment quand le nombre d’entrées déborde', () => {
    const cache = new LeastRecentlyUsedPageCache({ maximumEntryCount: 2, maximumByteCount: 1000 });
    cache.store(entryOf('a/'));
    cache.store(entryOf('b/'));
    cache.find('a/', now);
    cache.store(entryOf('c/'));

    expect(cache.find('b/', now)).toBeUndefined();
    expect(cache.find('a/', now)).toBeDefined();
    expect(cache.find('c/', now)).toBeDefined();
  });

  it('chasse les plus anciennes quand les octets débordent', () => {
    const cache = new LeastRecentlyUsedPageCache({ maximumEntryCount: 10, maximumByteCount: 10 });
    cache.store(entryOf('a/', { body: '123456' }));
    cache.store(entryOf('b/', { body: '123456' }));

    expect(cache.find('a/', now)).toBeUndefined();
    expect(cache.find('b/', now)).toBeDefined();
  });

  it('ne garde pas une page plus grosse que tout le cache', () => {
    const cache = new LeastRecentlyUsedPageCache({ maximumEntryCount: 10, maximumByteCount: 5 });
    cache.store(entryOf('a/', { body: '123456' }));

    expect(cache.entryCount).toBe(0);
  });

  it('ne rend jamais une page expirée', () => {
    const cache = new LeastRecentlyUsedPageCache({ maximumEntryCount: 10, maximumByteCount: 1000 });
    cache.store(entryOf('a/', { expiresAt: now }));

    expect(cache.find('a/', now)).toBeUndefined();
    expect(cache.entryCount).toBe(0);
  });

  it('remplace la page d’une même clé sans compter ses octets deux fois', () => {
    const cache = new LeastRecentlyUsedPageCache({ maximumEntryCount: 10, maximumByteCount: 8 });
    cache.store(entryOf('a/', { body: '123456' }));
    cache.store(entryOf('a/', { body: '654321' }));

    expect(cache.find('a/', now)?.body).toBe('654321');
  });
});
