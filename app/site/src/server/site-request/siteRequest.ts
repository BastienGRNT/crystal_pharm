/** Ce que le middleware a établi d'une requête sur le domaine d'un Tenant, avant tout rendu. */
export type SiteRequest = {
  /** Résolu en base depuis le Host de la requête : jamais d'un en-tête, jamais d'un paramètre. */
  tenantId: string;
  siteAccessEndsAt: Date;
  /** Pris avant de lire la base : une page rendue pendant une notification n'est pas gardée. */
  evictionCountBeforeReading: number;
  /** Absent si la page ne se garde pas. */
  pageCacheKey: string | undefined;
};

/** Ce que la lecture du site apprend, et dont dépend la durée de vie de la page en cache. */
export type PageCacheContext = {
  displayedGroupId: string | undefined;
  expiresAt: Date;
};

type Locals = Record<string, unknown>;

const siteRequestKey = 'siteRequest';
// `entry-server.tsx` ne reçoit que la requête : SolidStart range `locals` dans un objet
// interne de son contexte (`request.context.solidFetchEvent`), on ne s'y fie pas.
const localsByRequest = new WeakMap<Request, Locals>();
const pageCacheContextKey = 'pageCacheContext';

/** Appelée par le middleware : `entry-server.tsx` retrouve ensuite les `locals` de la requête. */
export function rememberLocalsOfRequest(request: Request, locals: Locals): void {
  localsByRequest.set(request, locals);
}

export function findLocalsOfRequest(request: Request): Locals | undefined {
  return localsByRequest.get(request);
}

export function setSiteRequest(locals: Locals, siteRequest: SiteRequest): void {
  locals[siteRequestKey] = siteRequest;
}

export function findSiteRequest(locals: Locals | undefined): SiteRequest | undefined {
  return locals?.[siteRequestKey] as SiteRequest | undefined;
}

export function setPageCacheContext(locals: Locals, pageCacheContext: PageCacheContext): void {
  locals[pageCacheContextKey] = pageCacheContext;
}

export function findPageCacheContext(locals: Locals | undefined): PageCacheContext | undefined {
  return locals?.[pageCacheContextKey] as PageCacheContext | undefined;
}
