import { createMiddleware } from '@solidjs/start/middleware';
import { readPreviewParentOrigin } from './server/preview/previewSettings';
import { assertProductionSecretsAreStrong } from './server/production-secrets/assertProductionSecretsAreStrong.server';
import { prepareSiteRequest } from './server/site-request/prepareSiteRequest.server';
import { isCacheableSitePageRequest, isPreviewRequest } from './server/site-request/sitePaths';
import { rememberLocalsOfRequest, setSiteRequest } from './server/site-request/siteRequest';
import { cacheControlOfSitePage, frameAncestorsPolicyOfSitePage, sitePageCacheHeaderName } from './server/site-responses/sitePageHeaders';

assertProductionSecretsAreStrong(['SITE_PREVIEW_MEDIA_SECRET', 'SiteService__ApiKey']);

export default createMiddleware({
  onRequest: async (event) => {
    const prepared = await prepareSiteRequest(event.request);
    if (prepared.kind === 'respond') return prepared.response;
    if (!prepared.siteRequest) return;
    setSiteRequest(event.locals, prepared.siteRequest);
    rememberLocalsOfRequest(event.request, event.locals);
  },
  onBeforeResponse: (event) => {
    const url = new URL(event.request.url);
    const frameAncestorsPolicy = isPreviewRequest(url) ? `frame-ancestors ${readPreviewParentOrigin()}` : frameAncestorsPolicyOfSitePage;
    const policyOfResponse = event.response.headers.get('content-security-policy');
    if (!policyOfResponse?.includes('frame-ancestors')) {
      event.response.headers.set('content-security-policy', policyOfResponse ? `${policyOfResponse}; ${frameAncestorsPolicy}` : frameAncestorsPolicy);
    }
    if (event.response.headers.has('cache-control')) return;
    const isSitePageOfTenant = isCacheableSitePageRequest(event.request, url) && event.response.status === 200 && event.locals.siteRequest !== undefined;
    event.response.headers.set('cache-control', isSitePageOfTenant ? cacheControlOfSitePage : 'no-store');
    if (import.meta.env.DEV && event.locals.siteRequest !== undefined) event.response.headers.set(sitePageCacheHeaderName, 'miss');
  },
});
