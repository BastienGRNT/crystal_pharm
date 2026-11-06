// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { storePageUnlessEvictedSince } from './server/cache/sitePageCache.server';
import { isCacheableSitePageRequest } from './server/site-request/sitePaths';
import { findLocalsOfRequest, findPageCacheContext, findSiteRequest, isSitePageFound, type PageCacheContext, type SiteRequest } from './server/site-request/siteRequest';
import { cacheControlOfSitePage, frameAncestorsPolicyOfSitePage } from './server/site-responses/sitePageHeaders';
import { countPageView } from './server/site-traffic/pageViewCounter.server';

type ServerRequest = Parameters<typeof handleRequest.fetch>[0];

const handleRequest = createHandler(() => (
  <StartServer
    document={({ assets, children, scripts }) => (
      <html lang="fr">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          {assets}
        </head>
        <body style={{ margin: '0' }}>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

/** Compte la page rendue et la garde pour la rejouer, sans retarder le flux envoyé au navigateur. */
async function handleRenderedPage(request: ServerRequest, response: Response): Promise<void> {
  const locals = findLocalsOfRequest(request);
  const siteRequest = findSiteRequest(locals);
  const url = new URL(request.url);
  if (!siteRequest || !isCacheableSitePageRequest(request, url) || response.status !== 200) return;
  const contentType = response.headers.get('content-type');
  if (!contentType?.startsWith('text/html')) return;
  // Le rendu est en flux : on ne sait la page trouvée, et sa durée de vie, qu'une fois le site lu, pendant ce flux.
  const body = await response.text();
  if (!isSitePageFound(locals)) return;
  // Une page rejouée depuis le cache ne passe pas ici : elle est comptée par `prepareSiteRequest`.
  countPageView(siteRequest.tenantId, request, url);
  keepRenderedPage(siteRequest, contentType, body, findPageCacheContext(locals));
}

function keepRenderedPage(siteRequest: SiteRequest, contentType: string, body: string, pageCacheContext: PageCacheContext | undefined): void {
  if (!siteRequest.pageCacheKey || !pageCacheContext) return;
  storePageUnlessEvictedSince(siteRequest.evictionCountBeforeReading, {
    key: siteRequest.pageCacheKey,
    page: {
      status: 200,
      headers: [
        ['content-type', contentType],
        ['cache-control', cacheControlOfSitePage],
        ['content-security-policy', frameAncestorsPolicyOfSitePage],
      ],
      body,
    },
    tenantId: siteRequest.tenantId,
    groupId: pageCacheContext.displayedGroupId,
    expiresAt: pageCacheContext.expiresAt,
  });
}

// Le middleware et le rendu partagent les `locals` de la requête : c'est par eux que passent le Tenant et la durée de vie de la page.
export default {
  async fetch(request: ServerRequest): Promise<Response> {
    const response = await handleRequest.fetch(request);
    void handleRenderedPage(request, response.clone()).catch(() => undefined);
    return response;
  },
};
