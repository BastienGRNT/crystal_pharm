import { eq } from 'drizzle-orm';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { tenantToolAccess } from '../database/billingTables';
import { findToolAccessDifferences, type ToolAccessDifference } from './toolAccessConsistency';
import { computeToolAccessOfTenant, rebuildToolAccessOfTenant } from './rebuildToolAccessOfTenant.server';

export type ToolAccessReconciliation = { tenantId: string; differences: ToolAccessDifference[] };

/**
 * Vérifie la projection d'un Tenant contre ce que ses abonnements et son
 * groupement disent, et la répare si elle diverge (un départ de groupement
 * écrit par `group-db` n'appelle pas billing-db : c'est ici qu'on le rattrape).
 */
export function reconcileToolAccessOfTenant(tenantId: string, now: Date): Promise<ToolAccessReconciliation> {
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const expected = await computeToolAccessOfTenant(transaction, tenantId, now);
		const storedRows = await transaction.select().from(tenantToolAccess).where(eq(tenantToolAccess.tenantId, tenantId));
		const differences = findToolAccessDifferences(expected, storedRows);
		if (differences.length > 0) await rebuildToolAccessOfTenant(transaction, tenantId, now);
		return { tenantId, differences };
	});
}
