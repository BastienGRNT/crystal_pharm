import { and, desc, eq } from 'drizzle-orm';
import type { BillingAccess, BillingTransaction } from '../database/billingDatabase.server';
import { runWithBillingAccess } from '../database/billingDatabase.server';
import { checkouts, payments, type CheckoutLine, type CheckoutPurpose, type CheckoutStatus } from '../database/billingTables';
import type { ToolKey } from '../tools/tools';
import { vatRatePercent } from '../invoicing/vatAmounts';
import { getPaymentProvider } from './paymentProvider';

/** Qui paie : une pharmacie (son abonnement) ou un groupement (son contrat). */
export type Payer = { tenantId: string } | { groupId: string };

export type CheckoutOpening = {
	purpose: CheckoutPurpose;
	toolKeys?: readonly ToolKey[];
	lines: readonly CheckoutLine[];
	amountCents: number;
	description: string;
	/** La page où revenir une fois le paiement fait (ou refusé). */
	returnPathname: string;
};

export type Checkout = {
	checkoutId: string;
	description: string;
	lines: CheckoutLine[];
	amountCents: number;
	status: CheckoutStatus;
	returnPathname: string;
};

export type Payment = {
	paymentId: string;
	description: string;
	amountCents: number;
	status: 'paid' | 'refunded';
	paidAt: Date;
	refundedAt: Date | undefined;
};

export function toPayerAccess(payer: Payer): BillingAccess {
	return 'tenantId' in payer ? { tenantId: payer.tenantId } : { groupId: payer.groupId };
}

/** Ouvre une page de paiement ; renvoie l'adresse où l'envoyer. */
export async function openCheckout(
	transaction: BillingTransaction,
	payer: Payer,
	checkoutOpening: CheckoutOpening
): Promise<string> {
	const checkoutId = crypto.randomUUID();
	await transaction.insert(checkouts).values({
		id: checkoutId,
		tenantId: 'tenantId' in payer ? payer.tenantId : null,
		groupId: 'groupId' in payer ? payer.groupId : null,
		purpose: checkoutOpening.purpose,
		toolKeys: [...(checkoutOpening.toolKeys ?? [])],
		lines: [...checkoutOpening.lines],
		amountCents: checkoutOpening.amountCents,
		description: checkoutOpening.description,
		returnPathname: checkoutOpening.returnPathname
	});
	return getPaymentProvider().locateCheckout(checkoutId);
}

export async function getCheckout(payer: Payer, checkoutId: string): Promise<Checkout | undefined> {
	const [checkout] = await runWithBillingAccess(toPayerAccess(payer), (transaction) =>
		transaction.select().from(checkouts).where(and(eq(checkouts.id, checkoutId), payerCondition(payer)))
	);
	if (!checkout) return undefined;
	return {
		checkoutId: checkout.id,
		description: checkout.description,
		lines: withVatLine(checkout.lines, checkout.amountCents),
		amountCents: checkout.amountCents,
		status: checkout.status,
		returnPathname: checkout.returnPathname
	};
}

export function listPayments(payer: Payer): Promise<Payment[]> {
	return runWithBillingAccess(toPayerAccess(payer), async (transaction) => {
		const paymentRows = await transaction
			.select()
			.from(payments)
			.where('tenantId' in payer ? eq(payments.tenantId, payer.tenantId) : eq(payments.groupId, payer.groupId))
			.orderBy(desc(payments.paidAt));
		return paymentRows.map((paymentRow) => ({
			paymentId: paymentRow.id,
			description: paymentRow.description,
			amountCents: paymentRow.amountCents,
			status: paymentRow.status,
			paidAt: paymentRow.paidAt,
			refundedAt: paymentRow.refundedAt ?? undefined
		}));
	});
}

export function payerCondition(payer: Payer) {
	return 'tenantId' in payer ? eq(checkouts.tenantId, payer.tenantId) : eq(checkouts.groupId, payer.groupId);
}

/** Les lignes sont hors taxes ; le montant payé est TTC : la différence est la TVA. */
function withVatLine(lines: CheckoutLine[], totalCents: number): CheckoutLine[] {
	const subtotalCents = lines.reduce((total, line) => total + line.amountCents, 0);
	return [...lines, { label: `TVA (${vatRatePercent} %)`, amountCents: totalCents - subtotalCents }];
}
