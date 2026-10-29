// La passerelle ne garde plus rien : le navigateur ne garde pas non plus une page sans la redemander,
// et aucun cache partagé n'en garde une copie. Le cache de `app/site` est en mémoire, et vidé par Postgres.
export const cacheControlOfSitePage = 'private, max-age=0';

export const frameAncestorsPolicyOfSitePage = "frame-ancestors 'none'";

/** En dev seulement : `hit` (rejouée depuis le cache) ou `miss` (lue en base et rendue), pour le vérifier avec curl. */
export const sitePageCacheHeaderName = 'x-site-cache';
