import { readUrlFromEnvironment } from './siteUrlEnvironment.server';

/** L'adresse publique du site d'un Tenant : un sous-domaine des sites, en attendant ses propres domaines. */
export function readPublicSiteUrl(tenantId: string): string {
	const publicSiteUrl = readUrlFromEnvironment('SITE_URL');
	publicSiteUrl.hostname = `${tenantId}.${publicSiteUrl.hostname}`;
	return publicSiteUrl.href;
}
