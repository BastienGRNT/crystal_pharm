/** Ce qu'une vue apporte au compteur : rien qui désigne le Visitor. */
export type CountedPageView = { pagePath: string; isStartOfVisit: boolean };

// Les robots qui s'annoncent : ceux qui se font passer pour un navigateur sont comptés, faute de mieux sans cookie.
const automatedClientPattern = /bot|crawl|spider|slurp|archiver|facebookexternalhit|embedly|preview|headless|lighthouse|pingdom|uptime|monitor|curl|wget|python|httpclient|okhttp|go-http|java\//i;
const maximumPagePathLength = 200;

/** Une page réellement affichée par une personne : ni un robot, ni un préchargement du navigateur. */
export function readCountedPageView(request: Request, url: URL): CountedPageView | undefined {
  const userAgent = request.headers.get('user-agent');
  if (!userAgent || automatedClientPattern.test(userAgent)) return undefined;
  if (isPrefetch(request.headers)) return undefined;
  return { pagePath: toCountedPagePath(url), isStartOfVisit: isStartOfVisit(request.headers.get('referer'), url.host) };
}

function isPrefetch(headers: Headers): boolean {
  const purpose = headers.get('sec-purpose') ?? headers.get('purpose') ?? headers.get('x-moz') ?? '';
  return /prefetch|prerender/i.test(purpose);
}

/** Une vue arrivée d'ailleurs que du site lui-même (un moteur de recherche, un lien, l'adresse tapée) commence une visite. */
function isStartOfVisit(referer: string | null, siteHost: string): boolean {
  if (!referer) return true;
  try {
    return new URL(referer).host !== siteHost;
  } catch {
    return true;
  }
}

/** Le chemin seul, sans les paramètres : « /equipe/ » et « /equipe?x=1 » sont la même page. */
export function toCountedPagePath(url: URL): string {
  const pathWithoutTrailingSlash = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;
  return (pathWithoutTrailingSlash || '/').slice(0, maximumPagePathLength);
}
