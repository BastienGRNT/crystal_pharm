import { runAsTenant, type ContentTransaction } from '@crystal-pharm/content-db';
import { siteSubdomains } from '@crystal-pharm/content-db/tables';
import { and, eq } from 'drizzle-orm';

export type SubdomainChange = 'changed' | 'taken';

const uniqueViolationCode = '23505';

/**
 * L'adresse devient l'actuelle du site. L'ancienne reste au Tenant : elle
 * redirige vers la nouvelle, et il peut y revenir. Une adresse qu'un autre
 * site a eue un jour est prise, même s'il l'a quittée.
 */
export async function changeSiteSubdomain(tenantId: string, subdomain: string): Promise<SubdomainChange> {
	try {
		await runAsTenant(tenantId, async (transaction) => {
			await retireCurrentSubdomain(transaction, tenantId);
			// La Row-Level Security ne montre que les adresses du Tenant : une adresse d'un autre fait échouer l'insertion.
			if (await isSubdomainOfTenant(transaction, subdomain)) {
				await transaction.update(siteSubdomains).set({ isCurrent: true }).where(eq(siteSubdomains.subdomain, subdomain));
			} else {
				await transaction.insert(siteSubdomains).values({ subdomain, tenantId, isCurrent: true });
			}
		});
		return 'changed';
	} catch (error) {
		if (hasDatabaseErrorCode(error, uniqueViolationCode)) return 'taken';
		throw error;
	}
}

async function retireCurrentSubdomain(transaction: ContentTransaction, tenantId: string): Promise<void> {
	await transaction
		.update(siteSubdomains)
		.set({ isCurrent: false })
		.where(and(eq(siteSubdomains.tenantId, tenantId), eq(siteSubdomains.isCurrent, true)));
}

async function isSubdomainOfTenant(transaction: ContentTransaction, subdomain: string): Promise<boolean> {
	const rows = await transaction.select({ subdomain: siteSubdomains.subdomain }).from(siteSubdomains).where(eq(siteSubdomains.subdomain, subdomain));
	return rows.length > 0;
}

// Drizzle enveloppe l'erreur de Postgres : son code est plus bas dans la chaîne des causes.
function hasDatabaseErrorCode(error: unknown, code: string): boolean {
	for (let cause: unknown = error; cause instanceof Error; cause = cause.cause) {
		if ('code' in cause && cause.code === code) return true;
	}
	return false;
}
