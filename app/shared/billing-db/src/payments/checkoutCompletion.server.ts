import { and, eq } from 'drizzle-orm';
import { writeGroupContractStatus } from '../contracts/groupContracts.server';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { checkouts, payments } from '../database/billingTables';
import { applyToolSelection } from '../subscriptions/tenantSubscriptions.server';
import { payerCondition, toPayerAccess, type Payer } from './checkoutSessions.server';
import { getPaymentProvider } from './paymentProvider';

export type CheckoutOutcome = 'paid' | 'refused';

export type CheckoutCompletion =
	| { isCompleted: true; outcome: CheckoutOutcome; returnPathname: string }
	| { isCompleted: false; failureMessage: string };

/**
 * Clôt une page de paiement. En dev, c'est la page de test qui l'appelle ;
 * avec Stripe, ce sera son webhook. Un paiement réussi applique aussitôt ce
 * qu'il payait : les Tools de l'abonnement, ou l'activation du contrat.
 */
export async function completeCheckout(
	payer: Payer,
	checkoutId: string,
	outcome: CheckoutOutcome
): Promise<CheckoutCompletion> {
	const completedCheckout = await runWithBillingAccess(toPayerAccess(payer), async (transaction) => {
		const now = new Date();
		const [checkout] = await transaction
			.update(checkouts)
			.set({ status: outcome, completedAt: now })
			.where(and(eq(checkouts.id, checkoutId), payerCondition(payer), eq(checkouts.status, 'open')))
			.returning();
		if (!checkout) return undefined;
		if (outcome === 'refused') return checkout;

		await transaction.insert(payments).values({
			id: crypto.randomUUID(),
			tenantId: checkout.tenantId,
			groupId: checkout.groupId,
			checkoutId: checkout.id,
			amountCents: checkout.amountCents,
			description: checkout.description,
			status: 'paid',
			providerPaymentReference: getPaymentProvider().createPaymentReference(checkout.id),
			paidAt: now
		});
		if (checkout.purpose === 'tenant_tools' && checkout.tenantId) {
			await applyToolSelection(transaction, checkout.tenantId, checkout.toolKeys, now);
		}
		return checkout;
	});
	if (!completedCheckout) return { isCompleted: false, failureMessage: 'Ce paiement est déjà terminé ou n’existe pas.' };

	// Le contrat appartient à la Platform : c'est elle qui l'active, une fois le paiement constaté.
	if (outcome === 'paid' && completedCheckout.purpose === 'group_contract' && completedCheckout.groupId) {
		const groupId = completedCheckout.groupId;
		await runWithBillingAccess(platformBillingAccess, (transaction) => writeGroupContractStatus(transaction, groupId, 'active'));
	}
	return { isCompleted: true, outcome, returnPathname: completedCheckout.returnPathname };
}
