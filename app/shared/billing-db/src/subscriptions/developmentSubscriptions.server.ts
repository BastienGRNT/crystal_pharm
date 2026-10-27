import { and, eq, isNull, sql } from 'drizzle-orm';
import { rebuildToolAccessOfTenant } from '../access/rebuildToolAccessOfTenant.server';
import { runWithBillingAccess } from '../database/billingDatabase.server';
import { payments, tenantSubscriptions } from '../database/billingTables';
import { fakeDeclinedCardReference } from '../payments/paymentProvider';
import { renewSubscription } from '../renewal/subscriptionRenewal.server';

/** Outil de dev : la pharmacie repart sans abonnement ni paiement. */
export async function deleteSubscriptionsOfTenant(tenantId: string): Promise<void> {
	await runWithBillingAccess({ tenantId }, async (transaction) => {
		await transaction.delete(tenantSubscriptions).where(eq(tenantSubscriptions.tenantId, tenantId));
		await transaction.delete(payments).where(eq(payments.tenantId, tenantId));
	});
}

/** Outil de dev : vieillit l'abonnement, pour sortir de la période « satisfait ou remboursé ». */
export async function backdateSubscriptionsOfTenant(tenantId: string, dayCount: number): Promise<void> {
	await runWithBillingAccess({ tenantId }, async (transaction) => {
		const interval = sql.raw(`interval '${Math.trunc(dayCount)} days'`);
		await transaction
			.update(tenantSubscriptions)
			.set({ startedAt: sql`${tenantSubscriptions.startedAt} - ${interval}` })
			.where(eq(tenantSubscriptions.tenantId, tenantId));
		await transaction
			.update(payments)
			.set({ paidAt: sql`${payments.paidAt} - ${interval}` })
			.where(eq(payments.tenantId, tenantId));
	});
}

/** Outil de dev : les prochains prélèvements de la pharmacie sont refusés par le faux prestataire. */
export async function declineNextPaymentsOfTenant(tenantId: string): Promise<void> {
	await runWithBillingAccess({ tenantId }, (transaction) =>
		transaction
			.update(tenantSubscriptions)
			.set({ providerSubscriptionReference: fakeDeclinedCardReference })
			.where(eq(tenantSubscriptions.tenantId, tenantId))
	);
}

/**
 * Outil de dev : l'échéance de l'abonnement est passée de deux jours et son
 * prélèvement est refusé : il passe en retard, les modules restent ouverts par la grâce.
 */
export async function makeSubscriptionOverdueOfTenant(tenantId: string, now = new Date()): Promise<void> {
	const overdueSince = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
	const subscription = await runWithBillingAccess({ tenantId }, async (transaction) => {
		const [subscriptionRow] = await transaction
			.update(tenantSubscriptions)
			.set({ providerSubscriptionReference: fakeDeclinedCardReference, billedUntil: overdueSince })
			.where(and(eq(tenantSubscriptions.tenantId, tenantId), isNull(tenantSubscriptions.endsAt)))
			.returning({ id: tenantSubscriptions.id });
		if (subscriptionRow) await rebuildToolAccessOfTenant(transaction, tenantId, now);
		return subscriptionRow;
	});
	if (subscription) await renewSubscription(subscription.id, tenantId, now);
}
