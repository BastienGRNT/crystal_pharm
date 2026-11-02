import { describe, expect, it } from 'vitest';
import { readCountedPageView, toCountedPagePath } from './pageViewCounting';
import { PageViewTally } from './pageViewTally';

const browserUserAgent = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36';
const siteUrl = new URL('https://saint-louis.crystal-pharm.fr/equipe?onglet=2');
const tenantId = '00000000-0000-4000-8000-000000000001';

function requestWith(headers: Record<string, string>): Request {
  return new Request(siteUrl, { headers: { 'user-agent': browserUserAgent, ...headers } });
}

describe('readCountedPageView', () => {
  it('compte une page affichée par un navigateur, sans ses paramètres', () => {
    expect(readCountedPageView(requestWith({}), siteUrl)).toEqual({ pagePath: '/equipe', isStartOfVisit: true });
  });

  it('ne compte ni un robot, ni une requête sans navigateur, ni un préchargement', () => {
    expect(readCountedPageView(requestWith({ 'user-agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }), siteUrl)).toBeUndefined();
    expect(readCountedPageView(new Request(siteUrl), siteUrl)).toBeUndefined();
    expect(readCountedPageView(requestWith({ 'sec-purpose': 'prefetch;prerender' }), siteUrl)).toBeUndefined();
  });

  it('une page ouverte depuis le site lui-même ne commence pas une visite', () => {
    expect(readCountedPageView(requestWith({ referer: 'https://saint-louis.crystal-pharm.fr/' }), siteUrl)?.isStartOfVisit).toBe(false);
    expect(readCountedPageView(requestWith({ referer: 'https://www.google.com/' }), siteUrl)?.isStartOfVisit).toBe(true);
    expect(readCountedPageView(requestWith({ referer: 'pas une adresse' }), siteUrl)?.isStartOfVisit).toBe(true);
  });
});

describe('toCountedPagePath', () => {
  it('garde l’accueil et retire la barre finale', () => {
    expect(toCountedPagePath(new URL('https://a.fr/'))).toBe('/');
    expect(toCountedPagePath(new URL('https://a.fr/ordonnance/'))).toBe('/ordonnance');
  });
});

describe('PageViewTally', () => {
  it('additionne les vues de la même heure et de la même page', () => {
    const tally = new PageViewTally(10);
    tally.add(tenantId, { pagePath: '/', isStartOfVisit: true }, new Date('2026-11-01T09:05:00Z'));
    tally.add(tenantId, { pagePath: '/', isStartOfVisit: false }, new Date('2026-11-01T09:55:00Z'));
    tally.add(tenantId, { pagePath: '/', isStartOfVisit: true }, new Date('2026-11-01T10:01:00Z'));

    expect(tally.drain()).toEqual([
      { tenantId, hourStart: new Date('2026-11-01T09:00:00Z'), pagePath: '/', viewCount: 2, visitCount: 1 },
      { tenantId, hourStart: new Date('2026-11-01T10:00:00Z'), pagePath: '/', viewCount: 1, visitCount: 1 }
    ]);
    expect(tally.drain()).toEqual([]);
  });

  it('remet les vues non écrites, et ne grossit plus au-delà de sa borne', () => {
    const tally = new PageViewTally(1);
    const viewedAt = new Date('2026-11-01T09:05:00Z');
    tally.add(tenantId, { pagePath: '/', isStartOfVisit: true }, viewedAt);
    tally.add(tenantId, { pagePath: '/equipe', isStartOfVisit: true }, viewedAt);
    const drained = tally.drain();
    tally.add(tenantId, { pagePath: '/', isStartOfVisit: false }, viewedAt);
    tally.restore(drained);

    expect(tally.drain()).toEqual([{ tenantId, hourStart: new Date('2026-11-01T09:00:00Z'), pagePath: '/', viewCount: 2, visitCount: 1 }]);
  });
});
