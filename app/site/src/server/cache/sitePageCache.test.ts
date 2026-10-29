import { beforeEach, describe, expect, it } from 'vitest';
import { evictPagesAfterNotification } from './siteChangeListener.server';
import { evictAllPages, findCachedPage, readEvictionCount, storePageUnlessEvictedSince } from './sitePageCache.server';
import { parseSiteChangeNotification } from './siteChangeNotification';

const firstTenantId = '00000000-0000-4000-8000-000000000001';
const secondTenantId = '00000000-0000-4000-8000-000000000002';
const groupId = '00000000-0000-4000-8000-0000000000a1';
const inOneHour = new Date(Date.now() + 60 * 60 * 1000);

function storePage(key: string, tenantId: string, displayedGroupId?: string): void {
  storePageUnlessEvictedSince(readEvictionCount(), { key, page: { status: 200, headers: [], body: key }, tenantId, groupId: displayedGroupId, expiresAt: inOneHour });
}

beforeEach(evictAllPages);

describe('parseSiteChangeNotification', () => {
  it('lit un Tenant et un groupement', () => {
    expect(parseSiteChangeNotification(`tenant:${firstTenantId}`)).toEqual({ kind: 'tenant', id: firstTenantId });
    expect(parseSiteChangeNotification(`group:${groupId}`)).toEqual({ kind: 'group', id: groupId });
  });

  it('ne comprend pas un autre payload', () => {
    expect(parseSiteChangeNotification('tenant:pas-un-uuid')).toEqual({ kind: 'unknown' });
    expect(parseSiteChangeNotification('')).toEqual({ kind: 'unknown' });
  });
});

describe('l’éviction par notification', () => {
  it('« tenant:… » vide les pages de ce Tenant, pas celles des autres', () => {
    storePage('a/', firstTenantId);
    storePage('a/services', firstTenantId);
    storePage('b/', secondTenantId);

    evictPagesAfterNotification(`tenant:${firstTenantId}`);

    expect(findCachedPage('a/')).toBeUndefined();
    expect(findCachedPage('a/services')).toBeUndefined();
    expect(findCachedPage('b/')).toBeDefined();
  });

  it('« group:… » vide les pages qui affichent ce groupement', () => {
    storePage('a/', firstTenantId, groupId);
    storePage('b/', secondTenantId);

    evictPagesAfterNotification(`group:${groupId}`);

    expect(findCachedPage('a/')).toBeUndefined();
    expect(findCachedPage('b/')).toBeDefined();
  });

  it('un payload inconnu vide tout, par prudence', () => {
    storePage('a/', firstTenantId);

    evictPagesAfterNotification('n’importe quoi');

    expect(findCachedPage('a/')).toBeUndefined();
  });

  it('ne garde pas une page lue avant une notification qui est arrivée pendant son rendu', () => {
    const evictionCountBeforeReading = readEvictionCount();
    evictPagesAfterNotification(`tenant:${firstTenantId}`);

    storePageUnlessEvictedSince(evictionCountBeforeReading, { key: 'a/', page: { status: 200, headers: [], body: 'périmée' }, tenantId: firstTenantId, groupId: undefined, expiresAt: inOneHour });

    expect(findCachedPage('a/')).toBeUndefined();
  });
});
