import { runAsTenant } from '@crystal-pharm/content-db';
import { tenantSites } from '@crystal-pharm/content-db/tables';
import type { OnDutyPeriod } from '@crystal-pharm/schema';
import { eq } from 'drizzle-orm';

/** `false` tant que le Tenant n'a pas créé son site : les gardes sont une colonne de ce site. */
export async function saveOnDutyPeriods(tenantId: string, periods: OnDutyPeriod[]): Promise<boolean> {
	return runAsTenant(tenantId, async (transaction) => {
		const updatedSites = await transaction
			.update(tenantSites)
			.set({ onDutyPeriods: periods })
			.where(eq(tenantSites.tenantId, tenantId))
			.returning({ tenantId: tenantSites.tenantId });
		return updatedSites.length > 0;
	});
}
