import { and, eq } from 'drizzle-orm';
import { runWithBillingAccess } from '../database/billingDatabase.server';
import { checkouts } from '../database/billingTables';
import { chargeAndInvoice } from '../invoicing/invoices.server';
import { activateGroupContractForOnePeriod } from '../overview/groupBilling.server';
import { applyToolSelection, getToolAccessOfTenant } from '../subscriptions/tenantSubscriptions.server';
import { payerCondition, toPayerAccess, type Payer } from './checkoutSessions.server';

export type CheckoutOutcome = 'paid' | 'refused';

export type CheckoutCompletion =
	| { isCompleted: true; outcome: CheckoutOutcome; returnPathname: string }
	| { isCompleted: false; failureMessage: string };

/**
 * Clôt une page de paiement. En dev, c'est la page de test qui l'appelle ;
 * avec Stripe, ce sera son webhook. Un paiement réussi est facturé, puis
 * applique ce qu'il payait : les Tools de l'abonnement, ou le contrat.
 */
export async function completeCheckout(
	payer: Payer,
	checkoutId: string,
	outcome: CheckoutOutcome
): Promise<CheckoutCompletion> {
	const now = new Date();
	const [checkout] = await runWithBillingAccess(toPayerAccess(payer), (transaction) =>
		transaction
			.update(checkouts)
			.set({ status: outcome, completedAt: now })
			.where(and(eq(checkouts.id, checkoutId), payerCondition(payer), eq(checkouts.status, 'open')))
			.returning()
	);
	if (!checkout) return { isCompleted: false, failureMessage: 'Ce paiement est déjà terminé ou n’existe pas.' };
	if (outcome === 'refused') return { isCompleted: true, outcome, returnPathname: checkout.returnPathname };

	const periodEnd = await applyWhatWasPaid(checkout, now);
	await chargeAndInvoice({
		payer,
		lines: checkout.lines,
		description: checkout.description,
		periodStart: now,
		periodEnd,
		paymentMethod: 'card',
		checkoutId: checkout.id
	});
	return { isCompleted: true, outcome, returnPathname: checkout.returnPathname };
}

/** Renvoie la fin de la période payée. */
async function applyWhatWasPaid(checkout: typeof checkouts.$inferSelect, now: Date): Promise<Date | undefined> {
	if (checkout.purpose === 'group_contract' && checkout.groupId) return activateGroupContractForOnePeriod(checkout.groupId);
	if (checkout.purpose === 'tenant_tools' && checkout.tenantId) {
		const tenantId = checkout.tenantId;
		await runWithBillingAccess({ tenantId }, (transaction) =>
			applyToolSelection(transaction, tenantId, checkout.toolKeys, now, checkout.billingPeriod)
		);
		return (await getToolAccessOfTenant(tenantId)).subscription?.currentPeriodEndsAt;
	}
	return undefined;
}
