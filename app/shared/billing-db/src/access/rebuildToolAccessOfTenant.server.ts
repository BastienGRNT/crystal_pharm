import { readCoveringGroupOfTenant } from '@crystal-pharm/group-db';
import { pharmacyMemberships } from '@crystal-pharm/group-db/tables';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { readGroupContract } from '../contracts/groupContracts.server';
import { platformBillingAccess, runWithBillingAccess, type BillingTransaction } from '../database/billingDatabase.server';
import { offerVersionTools, tenantSubscriptionItems, tenantSubscriptions, tenantToolAccess } from '../database/billingTables';
import { unfoldIncludedTools, type ToolGrant } from '../tools/toolAccessRules';
import { describeGroupGrants, describeSubscriptionGrants, type SubscriptionItemForGrants } from './toolGrants';

const dayInMilliseconds = 24 * 60 * 60 * 1000;

/**
 * Le seul code qui écrit `tenant_tool_access`. Appelée à la fin de chaque
 * événement, dans sa transaction : elle relit les abonnements et le contrat du
 * groupement, applique les règles entre Tools, et remplace les lignes du Tenant.
 */
export async function rebuildToolAccessOfTenant(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date = new Date()
): Promise<void> {
	const keptGrants = await computeToolAccessOfTenant(transaction, tenantId, now);
	await transaction.delete(tenantToolAccess).where(eq(tenantToolAccess.tenantId, tenantId));
	if (keptGrants.length > 0) {
		await transaction.insert(tenantToolAccess).values(keptGrants.map((grant) => ({ tenantId, ...grant })));
	}
}

/** Ce que la projection devrait contenir, calculé depuis les abonnements et le contrat : sert à l'écrire et à la vérifier. */
export async function computeToolAccessOfTenant(
	transaction: BillingTransaction,
	tenantId: string,
	now: Date
): Promise<ToolGrant[]> {
	const grants = unfoldIncludedTools([
		...(await listSubscriptionGrants(transaction, tenantId, now)),
		...(await listGroupGrants(transaction, tenantId, now))
	]);
	const oldestKeptEnd = new Date(now.getTime() - dayInMilliseconds);
	return grants.filter((grant) => grant.endsAt > oldestKeptEnd);
}

/** Les Tenants qui ont un abonnement ou un groupement : ceux dont la projection peut contenir quelque chose. */
export async function listTenantIdsWithAccessSources(): Promise<string[]> {
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const subscriptionRows = await transaction.selectDistinct({ tenantId: tenantSubscriptions.tenantId }).from(tenantSubscriptions);
		const membershipRows = await transaction.selectDistinct({ tenantId: pharmacyMemberships.tenantId }).from(pharmacyMemberships);
		return [...new Set([...subscriptionRows, ...membershipRows].map((row) => row.tenantId))];
	});
}

/** Pour qui n'a pas de transaction ouverte : les outils de dev, après une écriture hors événement. */
export function rebuildToolAccessOfOneTenant(tenantId: string): Promise<void> {
	return runWithBillingAccess({ tenantId }, (transaction) => rebuildToolAccessOfTenant(transaction, tenantId));
}

/** Reconstruit la projection de tous les Tenants : après la migration, ou pour la réparer. */
export async function rebuildToolAccessOfAllTenants(): Promise<number> {
	const tenantIds = await listTenantIdsWithAccessSources();
	for (const tenantId of tenantIds) {
		await rebuildToolAccessOfOneTenant(tenantId);
	}
	return tenantIds.length;
}

async function listSubscriptionGrants(transaction: BillingTransaction, tenantId: string, now: Date): Promise<ToolGrant[]> {
	const oldestKeptEnd = new Date(now.getTime() - dayInMilliseconds);
	const subscriptionRows = await transaction
		.select()
		.from(tenantSubscriptions)
		.where(
			and(
				eq(tenantSubscriptions.tenantId, tenantId),
				or(isNull(tenantSubscriptions.endsAt), gt(tenantSubscriptions.endsAt, oldestKeptEnd))
			)
		);
	const grants: ToolGrant[] = [];
	for (const subscriptionRow of subscriptionRows) {
		const itemRows = await transaction
			.select()
			.from(tenantSubscriptionItems)
			.where(eq(tenantSubscriptionItems.subscriptionId, subscriptionRow.id));
		const items: SubscriptionItemForGrants[] = [];
		for (const itemRow of itemRows) {
			const toolRows = await transaction
				.select({ toolKey: offerVersionTools.toolKey })
				.from(offerVersionTools)
				.where(eq(offerVersionTools.offerVersionId, itemRow.offerVersionId));
			items.push({
				toolKeys: toolRows.map((toolRow) => toolRow.toolKey),
				startedAt: itemRow.startedAt,
				endsAt: itemRow.endsAt ?? undefined
			});
		}
		grants.push(
			...describeSubscriptionGrants({ billedUntil: subscriptionRow.billedUntil, endsAt: subscriptionRow.endsAt ?? undefined }, items)
		);
	}
	return grants;
}

async function listGroupGrants(transaction: BillingTransaction, tenantId: string, now: Date): Promise<ToolGrant[]> {
	const coveringGroup = await readCoveringGroupOfTenant(transaction, tenantId, now);
	if (!coveringGroup) return [];
	const contract = await readGroupContract(transaction, coveringGroup.groupId);
	if (contract?.status !== 'active' || !contract.activatedAt) return [];
	return describeGroupGrants({
		groupId: coveringGroup.groupId,
		coverages: contract.coverages,
		startsAt: contract.activatedAt,
		coverageEndsAt: coveringGroup.coverageEndsAt
	});
}
