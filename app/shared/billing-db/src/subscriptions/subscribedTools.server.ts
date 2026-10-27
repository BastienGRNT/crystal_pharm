import { and, eq, gt, inArray, isNull, or } from 'drizzle-orm';
import type { BillingTransaction } from '../database/billingDatabase.server';
import { offerVersionTools, tenantSubscriptionItems } from '../database/billingTables';
import { isIncludedTool, type ToolKey } from '../tools/tools';

export type SubscribedToolLine = {
	subscriptionId: string;
	toolKey: ToolKey;
	/** Retiré de l'abonnement : reste actif jusqu'à cette date. */
	endsAt: Date | undefined;
};

/**
 * Les Tools que paient les lignes d'abonnement encore actives : ceux de chaque
 * offre, sauf les Tools inclus avec un autre. Un Tool couvert par deux lignes
 * garde la fin la plus lointaine.
 */
export async function readSubscribedToolLines(
	transaction: BillingTransaction,
	subscriptionIds: readonly string[],
	now: Date
): Promise<SubscribedToolLine[]> {
	if (subscriptionIds.length === 0) return [];
	const toolRows = await transaction
		.select({
			subscriptionId: tenantSubscriptionItems.subscriptionId,
			toolKey: offerVersionTools.toolKey,
			endsAt: tenantSubscriptionItems.endsAt
		})
		.from(tenantSubscriptionItems)
		.innerJoin(offerVersionTools, eq(offerVersionTools.offerVersionId, tenantSubscriptionItems.offerVersionId))
		.where(
			and(
				inArray(tenantSubscriptionItems.subscriptionId, [...subscriptionIds]),
				or(isNull(tenantSubscriptionItems.endsAt), gt(tenantSubscriptionItems.endsAt, now))
			)
		);
	const lines = new Map<string, SubscribedToolLine>();
	for (const toolRow of toolRows) {
		if (isIncludedTool(toolRow.toolKey)) continue;
		const lineKey = `${toolRow.subscriptionId}:${toolRow.toolKey}`;
		const knownLine = lines.get(lineKey);
		const endsAt = toolRow.endsAt ?? undefined;
		const isLongerThanKnown = knownLine !== undefined && knownLine.endsAt !== undefined && (endsAt === undefined || endsAt > knownLine.endsAt);
		if (!knownLine || isLongerThanKnown) lines.set(lineKey, { subscriptionId: toolRow.subscriptionId, toolKey: toolRow.toolKey, endsAt });
	}
	return [...lines.values()];
}
