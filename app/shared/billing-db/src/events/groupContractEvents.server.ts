import { listCoveredTenantIdsOfGroup } from '@crystal-pharm/group-db';
import { desc, eq, isNull, and } from 'drizzle-orm';
import { readGroupContract } from '../contracts/groupContracts.server';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { groupContractVersions } from '../database/billingTables';
import { rebuildToolAccessOfTenant } from '../access/rebuildToolAccessOfTenant.server';

/**
 * Événement : le contrat d'un groupement a changé (conditions ou statut). La
 * version précédente est close, la nouvelle ouverte avec les conditions
 * d'aujourd'hui, et les accès de chaque pharmacie couverte sont refaits.
 */
export async function recordGroupContractChange(groupId: string, now: Date): Promise<void> {
	const coveredTenantIds = await listCoveredTenantIdsOfGroup(platformBillingAccess, groupId, now);
	await runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const contract = await readGroupContract(transaction, groupId);
		if (contract) {
			const [latestVersionRow] = await transaction
				.select({ versionNumber: groupContractVersions.versionNumber })
				.from(groupContractVersions)
				.where(eq(groupContractVersions.groupId, groupId))
				.orderBy(desc(groupContractVersions.versionNumber))
				.limit(1);
			await transaction
				.update(groupContractVersions)
				.set({ endsAt: now })
				.where(and(eq(groupContractVersions.groupId, groupId), isNull(groupContractVersions.endsAt)));
			await transaction.insert(groupContractVersions).values({
				id: crypto.randomUUID(),
				groupId,
				versionNumber: (latestVersionRow?.versionNumber ?? 0) + 1,
				paymentMethod: contract.paymentMethod,
				billingMode: contract.billingMode,
				flatRateMonthlyPriceCents: contract.flatRateMonthlyPriceCents ?? null,
				coverages: contract.coverages,
				startsAt: now,
				endsAt: contract.status === 'active' ? null : now
			});
		}
		for (const tenantId of coveredTenantIds) await rebuildToolAccessOfTenant(transaction, tenantId, now);
	});
}
