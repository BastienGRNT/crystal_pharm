import { and, eq } from 'drizzle-orm';
import { runAsTenant, type ContentTransaction } from '../database/contentDatabase.server';
import { siteSubdomains } from '../database/contentTables';

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
