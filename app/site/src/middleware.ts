import { createMiddleware } from '@solidjs/start/middleware';
import { readPreviewParentOrigin } from './server/preview/previewSettings';
import { findTenantIdOfRequest } from './server/requestTenant';

const previewPath = '/__preview';
const mediaPath = '/__media';
// La passerelle garde la page 60 s sous une clé qui contient le Tenant et la version
// de son site (l'empreinte de tout ce qu'il affiche) : la moindre modification change
// la clé, la page en cache n'est plus jamais lue. Les 60 s ne bornent que le retard
// d'un nouveau déploiement de `app/site`.
const cacheControlOfSitePage = 'public, s-maxage=60, max-age=0';

function isPreviewRequest(url: URL): boolean {
  return isUnderPath(url, previewPath);
}

function isUnderPath(url: URL, path: string): boolean {
  return url.pathname === path || url.pathname.startsWith(`${path}/`);
}

function isCacheableSitePage(request: Request, status: number | undefined): boolean {
  const url = new URL(request.url);
  return (
    request.method === 'GET' &&
    (status === undefined || status === 200) &&
    findTenantIdOfRequest(request) !== undefined &&
    !isUnderPath(url, previewPath) &&
    !isUnderPath(url, mediaPath)
  );
}

export default createMiddleware({
  onRequest: (event) => {
    // L'aperçu n'est jamais servi sur le domaine d'un tenant : la passerelle y pose son en-tête.
    if (isPreviewRequest(new URL(event.request.url)) && findTenantIdOfRequest(event.request)) {
      return new Response('Page introuvable.', { status: 404 });
    }
  },
  onBeforeResponse: (event) => {
    const frameAncestors = isPreviewRequest(new URL(event.request.url)) ? readPreviewParentOrigin() : "'none'";
    const policyOfResponse = event.response.headers.get('content-security-policy');
    const frameAncestorsPolicy = `frame-ancestors ${frameAncestors}`;
    event.response.headers.set('content-security-policy', policyOfResponse ? `${policyOfResponse}; ${frameAncestorsPolicy}` : frameAncestorsPolicy);
    if (event.response.headers.has('cache-control')) return;
    event.response.headers.set('cache-control', isCacheableSitePage(event.request, event.response.status) ? cacheControlOfSitePage : 'no-store');
  },
});
