import { addGracePeriod } from '../subscriptions/paymentRetrySchedule';
import type { ToolCoverage } from '../pricing/toolPricing';
import type { ToolGrant } from '../tools/toolAccessRules';
import type { ToolKey } from '../tools/tools';

export const subscriptionGrantedBy = 'subscription';

/** Plus loin que tout abonnement : la prise en charge d'un groupement n'a pas de fin tant que la pharmacie reste membre. */
export const farFuture = new Date('9999-12-31T00:00:00Z');

export type SubscriptionForGrants = {
	billedUntil: Date;
	/** Résilié (ou abandonné après les relances) : la date où tout s'arrête. */
	endsAt: Date | undefined;
};

export type SubscriptionItemForGrants = {
	toolKeys: readonly ToolKey[];
	startedAt: Date;
	/** Retiré de l'abonnement : sa fin. */
	endsAt: Date | undefined;
};

/**
 * Ce qu'une ligne d'abonnement donne. Tant que l'abonnement continue, l'accès
 * dure 7 jours de plus que la période payée (la grâce d'un prélèvement raté) ;
 * résilié ou retiré, il s'arrête pile à sa date.
 */
export function describeSubscriptionGrants(
	subscription: SubscriptionForGrants,
	items: readonly SubscriptionItemForGrants[]
): ToolGrant[] {
	return items.flatMap((item) => {
		const endsAt = computeSubscriptionAccessEnd(subscription, item);
		if (endsAt <= item.startedAt) return [];
		return item.toolKeys.map(
			(toolKey): ToolGrant => ({
				toolKey,
				startsAt: item.startedAt,
				paidUntil: subscription.billedUntil,
				endsAt,
				grantedBy: subscriptionGrantedBy
			})
		);
	});
}

function computeSubscriptionAccessEnd(subscription: SubscriptionForGrants, item: SubscriptionItemForGrants): Date {
	const subscriptionAccessEnd = subscription.endsAt
		? new Date(Math.min(subscription.endsAt.getTime(), subscription.billedUntil.getTime()))
		: addGracePeriod(subscription.billedUntil);
	return item.endsAt ? new Date(Math.min(item.endsAt.getTime(), subscriptionAccessEnd.getTime())) : subscriptionAccessEnd;
}

/** Pris en charge : le groupement paie tout ou donne tout en remise ; sinon la pharmacie s'abonne toujours. */
export function isToolTakenInCharge(coverage: ToolCoverage): boolean {
	return coverage.groupSharePercent === 100 || coverage.discountPercent === 100;
}

export type GroupCoverageForGrants = {
	groupId: string;
	coverages: readonly ToolCoverage[];
	startsAt: Date;
	/** Le départ de la pharmacie : la prise en charge s'arrête à cette date. */
	coverageEndsAt: Date | undefined;
};

export function describeGroupGrants({ groupId, coverages, startsAt, coverageEndsAt }: GroupCoverageForGrants): ToolGrant[] {
	const endsAt = coverageEndsAt ?? farFuture;
	return coverages
		.filter(isToolTakenInCharge)
		.map((coverage): ToolGrant => ({ toolKey: coverage.toolKey, startsAt, paidUntil: endsAt, endsAt, grantedBy: groupId }));
}
