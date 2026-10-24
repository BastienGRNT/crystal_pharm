/**
 * Le panneau est servi sur `localhost`, les sites sur des sous-domaines de `localhost` : un lien du site
 * (`<a href="/ordonnance">`) garde ainsi son sous-domaine, donc le layout comparé, sans paramètre à transporter.
 */
export const playgroundPort = 5176;
export const playgroundPanelOrigin = `http://localhost:${playgroundPort}`;

const siteHostname = 'site.localhost';
const layoutComparisonHostnameSuffix = '.layout.localhost';

export function siteOrigin(): string {
  return `http://${siteHostname}:${playgroundPort}`;
}

export function layoutComparisonOrigin(layoutId: string): string {
  return `http://${layoutId}${layoutComparisonHostnameSuffix}:${playgroundPort}`;
}

export function isSiteHostname(hostname: string): boolean {
  return hostname === siteHostname || hostname.endsWith(layoutComparisonHostnameSuffix);
}

export function readComparedLayoutId(hostname: string): string | undefined {
  if (!hostname.endsWith(layoutComparisonHostnameSuffix)) return undefined;
  return hostname.slice(0, -layoutComparisonHostnameSuffix.length);
}

export function isPlaygroundOrigin(origin: string): boolean {
  const url = URL.canParse(origin) ? new URL(origin) : undefined;
  return url?.port === String(playgroundPort) && (url.hostname === 'localhost' || isSiteHostname(url.hostname));
}
