import { eq, sql } from 'drizzle-orm';
import { runWithBillingAccess } from '../database/billingDatabase.server';
import { payments, tenantSubscriptions } from '../database/billingTables';

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
