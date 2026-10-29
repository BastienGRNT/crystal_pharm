import type { CachedPage } from '../cache/leastRecentlyUsedPageCache';
import { startListeningToSiteChanges, isSiteChangeListenerConnected } from '../cache/siteChangeListener.server';
import { findCachedPage, readEvictionCount } from '../cache/sitePageCache.server';
import { readSiteAccessOfSubdomain } from '../site-access/readSiteAccessOfSubdomain.server';
import { findSubdomainOfHost, toCurrentAddress } from '../site-address/siteAddress';
import { sitePageCacheHeaderName } from '../site-responses/sitePageHeaders';
import { respondMovedPermanently, respondSiteNotFound, respondSiteUnavailable } from '../site-responses/siteResponses';
import { readSitesHostname } from './readSitesHostname';
import type { SiteRequest } from './siteRequest';
import { isBuiltAssetRequest, isCacheableSitePageRequest, isPreviewRequest } from './sitePaths';

export type PreparedSiteRequest =
  | { kind: 'respond'; response: Response }
  /** `siteRequest` est absent hors du domaine d'un Tenant (l'aperçu) et pour les fichiers du build. */
  | { kind: 'render'; siteRequest: SiteRequest | undefined };

/**
 * Ce que `app/site` décide avant tout rendu, depuis le seul Host de la requête :
 * une page en cache est rejouée sans toucher la base ; sinon un aller-retour dit
 * à quel Tenant est l'adresse et s'il a droit à son site (404, 503, 301 sinon).
 */
export async function prepareSiteRequest(request: Request): Promise<PreparedSiteRequest> {
  const url = new URL(request.url);
  const hostHeader = request.headers.get('host');
  const subdomain = findSubdomainOfHost(hostHeader, readSitesHostname());
  if (!subdomain) return { kind: 'render', siteRequest: undefined };

  // L'aperçu n'est jamais servi sur le domaine d'un tenant.
  if (isPreviewRequest(url)) return { kind: 'respond', response: new Response('Page introuvable.', { status: 404 }) };
  if (isBuiltAssetRequest(url)) return { kind: 'render', siteRequest: undefined };

  startListeningToSiteChanges();
  const pageCacheKey = isCacheableSitePageRequest(request, url) && isSiteChangeListenerConnected() ? `${subdomain}${url.pathname}` : undefined;
  const cachedPage = pageCacheKey && findCachedPage(pageCacheKey);
  if (cachedPage) return { kind: 'respond', response: replayCachedPage(cachedPage) };

  const evictionCountBeforeReading = readEvictionCount();
  const siteAccess = await readSiteAccessOfSubdomain(subdomain);
  switch (siteAccess.status) {
    case 'unknownAddress':
      return { kind: 'respond', response: respondSiteNotFound() };
    case 'siteNotSubscribed':
      return { kind: 'respond', response: respondSiteUnavailable() };
    case 'formerAddress':
      return {
        kind: 'respond',
        response: respondMovedPermanently(toCurrentAddress({ url: request.url, hostHeader, isSecure: url.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https' }, siteAccess.currentSubdomain, readSitesHostname())),
      };
    case 'available':
      return { kind: 'render', siteRequest: { tenantId: siteAccess.tenantId, siteAccessEndsAt: siteAccess.siteAccessEndsAt, evictionCountBeforeReading, pageCacheKey } };
  }
}

function replayCachedPage(cachedPage: CachedPage): Response {
  const response = new Response(cachedPage.body, { status: cachedPage.status, headers: cachedPage.headers });
  if (import.meta.env.DEV) response.headers.set(sitePageCacheHeaderName, 'hit');
  return response;
}
