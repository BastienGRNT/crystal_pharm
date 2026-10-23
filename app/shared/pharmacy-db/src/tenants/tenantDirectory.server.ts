import { asc, eq, inArray } from 'drizzle-orm';
import { runAsPlatform, runAsReaderOfTenants, runAsTenant } from '../database/pharmacyDatabase.server';
import { tenants } from '../database/pharmacyTables';

/** Ce qu'un groupement ou la Platform voit d'une pharmacie : ce que son site affiche déjà. */
export type TenantSummary = {
	tenantId: string;
	name: string;
	postalCode: string;
	city: string;
	createdAt: Date;
};

const tenantSummaryColumns = {
	tenantId: tenants.id,
	name: tenants.name,
	postalCode: tenants.postalCode,
	city: tenants.city,
	createdAt: tenants.createdAt
};

/** Les fiches résumées de ces Tenants (ceux d'un groupement, choisis par `shared/group-db`). */
export async function listTenantSummaries(tenantIds: readonly string[]): Promise<TenantSummary[]> {
	if (tenantIds.length === 0) return [];
	return runAsReaderOfTenants(tenantIds, (transaction) =>
		transaction
			.select(tenantSummaryColumns)
			.from(tenants)
			.where(inArray(tenants.id, [...tenantIds]))
			.orderBy(asc(tenants.name))
	);
}

/** Toutes les pharmacies, pour la Platform. */
export function listAllTenantSummaries(): Promise<TenantSummary[]> {
	return runAsPlatform((transaction) =>
		transaction.select(tenantSummaryColumns).from(tenants).orderBy(asc(tenants.name))
	);
}

/** Supprime la pharmacie et tout ce qui la référence (outil de dev, fermeture d'un compte). */
export async function deleteTenant(tenantId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) => transaction.delete(tenants).where(eq(tenants.id, tenantId)));
}
