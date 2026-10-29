// @refresh reload
import { createHandler, StartServer } from '@solidjs/start/server';
import { storePageUnlessEvictedSince } from './server/cache/sitePageCache.server';
import { findLocalsOfRequest, findPageCacheContext, findSiteRequest } from './server/site-request/siteRequest';
import { cacheControlOfSitePage, frameAncestorsPolicyOfSitePage } from './server/site-responses/sitePageHeaders';

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
        <body>
          <div id="app">{children}</div>
          {scripts}
        </body>
      </html>
    )}
  />
));

/** Garde la page rendue pour la rejouer, sans retarder le flux envoyé au navigateur. */
async function keepRenderedPage(request: ServerRequest, response: Response): Promise<void> {
  const locals = findLocalsOfRequest(request);
  const siteRequest = findSiteRequest(locals);
  if (!siteRequest?.pageCacheKey || response.status !== 200) return;
  const contentType = response.headers.get('content-type');
  if (!contentType?.startsWith('text/html')) return;
  // Le rendu est en flux : la durée de vie de la page n'est posée qu'une fois le site lu, pendant ce flux.
  const body = await response.text();
  const pageCacheContext = findPageCacheContext(locals);
  if (!pageCacheContext) return;
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
    void keepRenderedPage(request, response.clone()).catch(() => undefined);
    return response;
  },
};
