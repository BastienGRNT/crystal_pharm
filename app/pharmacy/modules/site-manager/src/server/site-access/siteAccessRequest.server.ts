import { canTenantUseTool } from '@crystal-pharm/billing-db';
import { findSiteOfSubdomain } from '@crystal-pharm/content-db';
import { timingSafeEqual } from 'node:crypto';
import { findSubdomainOfHost } from '../../domain/siteSubdomain';
import { readSitesHostname } from '../site-address/siteAddress.server';
import { readSiteVersion } from './siteVersion.server';

// La passerelle (Caddy, `forward_auth`) pose cette question avant chaque page
// d'un site : à quel Tenant est cette adresse, et peut-il la servir ? Elle
// recopie `X-Tenant-Id` et `X-Site-Version` vers `app/site`, et met la version
// dans la clé de son cache : toute modification de ce que le site affiche rend
// aussitôt l'ancienne page introuvable dans le cache, sans rien avoir à purger.

const gatewayTokenHeaderName = 'x-site-gateway-token';

/** 200 : servir le site ; 301 : ancienne adresse ; 402 : sans abonnement ; 404 : adresse inconnue ; 401 : pas la passerelle. */
export async function respondToSiteAccessRequest(request: Request): Promise<Response> {
	if (!isFromSiteGateway(request)) return respondWithoutCaching(401);

	const subdomain = findSubdomainOfHost(request.headers.get('x-forwarded-host') ?? '', readSitesHostname());
	const site = subdomain && (await findSiteOfSubdomain(subdomain));
	if (!site) return respondWithoutCaching(404);

	if (site.currentSubdomain !== subdomain) {
		return respondWithoutCaching(301, { location: toCurrentAddress(request, site.currentSubdomain) });
	}
	if (!(await canTenantUseTool(site.tenantId, 'site'))) return respondWithoutCaching(402);
	// Lue après l'abonnement : un Tenant supprimé, dont l'adresse resterait, s'arrête là.
	return respondWithoutCaching(200, { 'x-tenant-id': site.tenantId, 'x-site-version': await readSiteVersion(site.tenantId) });
}

function isFromSiteGateway(request: Request): boolean {
	const expectedToken = process.env.SITE_GATEWAY_TOKEN;
	if (!expectedToken) throw new Error('SITE_GATEWAY_TOKEN is missing from the environment.');
	const receivedToken = request.headers.get(gatewayTokenHeaderName) ?? '';
	const received = Buffer.from(receivedToken);
	const expected = Buffer.from(expectedToken);
	return received.length === expected.length && timingSafeEqual(received, expected);
}

// La même page à la nouvelle adresse. Un chemin qui commence par `//` serait lu
// comme une autre adresse : on le ramène à l'accueil plutôt que d'envoyer ailleurs.
function toCurrentAddress(request: Request, currentSubdomain: string): string {
	const requestedUri = request.headers.get('x-forwarded-uri') ?? '/';
	const pathAndQuery = requestedUri.startsWith('/') && !requestedUri.startsWith('//') ? requestedUri : '/';
	const protocol = request.headers.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
	const requestedHost = request.headers.get('x-forwarded-host') ?? '';
	const port = /:\d+$/.exec(requestedHost)?.[0] ?? '';
	return `${protocol}://${currentSubdomain}.${readSitesHostname()}${port}${pathAndQuery}`;
}

function respondWithoutCaching(status: number, headers: Record<string, string> = {}): Response {
	return new Response(null, { status, headers: { 'cache-control': 'no-store', ...headers } });
}
