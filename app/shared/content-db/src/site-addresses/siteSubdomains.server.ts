import { and, eq, sql } from 'drizzle-orm';
import { runAsSiteGateway, runAsTenant, type ContentTransaction } from '../database/contentDatabase.server';
import { siteSubdomains } from '../database/contentTables';

/** Le site servi à une adresse, tel que la passerelle doit le connaître. */
export type SiteOfSubdomain = {
	tenantId: string;
	/** Différente de l'adresse demandée quand celle-ci est une ancienne adresse du site. */
	currentSubdomain: string;
};

/** `undefined` si aucun site n'a jamais eu cette adresse. */
export function findSiteOfSubdomain(subdomain: string): Promise<SiteOfSubdomain | undefined> {
	return runAsSiteGateway(subdomain, async (transaction) => {
		const [requestedAddress] = await transaction
			.select({ tenantId: siteSubdomains.tenantId, isCurrent: siteSubdomains.isCurrent })
			.from(siteSubdomains)
			.where(eq(siteSubdomains.subdomain, subdomain));
		if (!requestedAddress) return undefined;

		if (requestedAddress.isCurrent) return { tenantId: requestedAddress.tenantId, currentSubdomain: subdomain };

		// Le Tenant vient de la ligne trouvée, jamais de la requête : on peut maintenant lire ses autres adresses.
		await transaction.execute(sql`select set_config('app.tenant_id', ${requestedAddress.tenantId}, true)`);
		const currentSubdomain = await readCurrentSubdomain(transaction, requestedAddress.tenantId);
		return { tenantId: requestedAddress.tenantId, currentSubdomain: currentSubdomain ?? subdomain };
	});
}

/** L'adresse actuelle du site du Tenant ; `undefined` tant qu'il n'en a pas choisi. */
export function findCurrentSiteSubdomain(tenantId: string): Promise<string | undefined> {
	return runAsTenant(tenantId, (transaction) => readCurrentSubdomain(transaction, tenantId));
}

async function readCurrentSubdomain(transaction: ContentTransaction, tenantId: string): Promise<string | undefined> {
	const [currentAddress] = await transaction
		.select({ subdomain: siteSubdomains.subdomain })
		.from(siteSubdomains)
		.where(and(eq(siteSubdomains.tenantId, tenantId), eq(siteSubdomains.isCurrent, true)));
	return currentAddress?.subdomain;
}
