const previewPath = '/__preview';
const mediaPath = '/__media';
const apiPath = '/api';
const serverFunctionPath = '/_server';
const builtAssetsPath = '/_build';

export function isUnderPath(url: URL, path: string): boolean {
  return url.pathname === path || url.pathname.startsWith(`${path}/`);
}

export function isPreviewRequest(url: URL): boolean {
  return isUnderPath(url, previewPath);
}

export function isBuiltAssetRequest(url: URL): boolean {
  return isUnderPath(url, builtAssetsPath);
}

/** Seule une page du site se garde : jamais l'aperçu, les images, l'API ni les fonctions serveur. */
export function isCacheableSitePageRequest(request: Request, url: URL): boolean {
  return (
    request.method === 'GET' &&
    !isPreviewRequest(url) &&
    !isBuiltAssetRequest(url) &&
    !isUnderPath(url, mediaPath) &&
    !isUnderPath(url, apiPath) &&
    !isUnderPath(url, serverFunctionPath)
  );
}
