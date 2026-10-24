import { createMiddleware } from '@solidjs/start/middleware';
import { readPreviewParentOrigin } from './server/preview/previewSettings';
import { findTenantIdOfRequest } from './server/requestTenant';

const previewPath = '/__preview';

function isPreviewRequest(url: URL): boolean {
  return url.pathname === previewPath || url.pathname.startsWith(`${previewPath}/`);
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
    event.response.headers.set('content-security-policy', `frame-ancestors ${frameAncestors}`);
  },
});
