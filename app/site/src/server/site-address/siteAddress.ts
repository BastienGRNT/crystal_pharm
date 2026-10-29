/**
 * Le sous-domaine d'un Host (`pharmacie-du-port.site.localhost:8080`), `undefined`
 * s'il n'est pas sous le domaine des sites. Le Host est écrit par le navigateur :
 * il est normalisé, et seul ce qui suit exactement le domaine des sites compte.
 */
export function findSubdomainOfHost(hostHeader: string | null, sitesHostname: string): string | undefined {
  const hostname = (hostHeader ?? '').toLowerCase().replace(/:\d+$/, '');
  const suffix = `.${sitesHostname.toLowerCase()}`;
  if (!hostname.endsWith(suffix)) return undefined;
  const subdomain = hostname.slice(0, -suffix.length);
  return /^[a-z0-9-]+$/.test(subdomain) ? subdomain : undefined;
}

/**
 * La même page à l'adresse actuelle du site. Un chemin qui commence par `//` serait lu
 * comme une autre adresse : on le ramène à l'accueil plutôt que d'envoyer ailleurs.
 */
export function toCurrentAddress(request: { url: string; hostHeader: string | null; isSecure: boolean }, currentSubdomain: string, sitesHostname: string): string {
  const { pathname, search } = new URL(request.url);
  const pathAndQuery = pathname.startsWith('/') && !pathname.startsWith('//') ? `${pathname}${search}` : '/';
  const port = /:\d+$/.exec(request.hostHeader ?? '')?.[0] ?? '';
  return `${request.isSecure ? 'https' : 'http'}://${currentSubdomain}.${sitesHostname}${port}${pathAndQuery}`;
}
