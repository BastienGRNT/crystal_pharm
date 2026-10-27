import { getPharmacyGroupForPlatform } from '@crystal-pharm/group-db';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { and, desc, eq, sql } from 'drizzle-orm';
import {
	platformBillingAccess,
	runWithBillingAccess,
	type BillingTransaction
} from '../database/billingDatabase.server';
import {
	invoiceSequences,
	invoices,
	payments,
	type InvoiceKind,
	type InvoiceLine,
	type InvoicePaymentMethod,
	type InvoiceStatus
} from '../database/billingTables';
import { toPayerAccess, type Payer } from '../payments/checkoutSessions.server';
import { getPaymentProvider } from '../payments/paymentProvider';
import { addVat, vatRatePercent } from './vatAmounts';

export type Invoice = {
	invoiceId: string;
	number: string;
	kind: InvoiceKind;
	issuedAt: Date;
	periodStart: Date | undefined;
	periodEnd: Date | undefined;
	customerName: string;
	customerAddressLines: string[];
	lines: InvoiceLine[];
	subtotalCents: number;
	vatRatePercent: number;
	vatCents: number;
	totalCents: number;
	status: InvoiceStatus;
	paymentMethod: InvoicePaymentMethod;
	paidAt: Date | undefined;
	/** Pour un avoir : le numéro de la facture qu'il annule. */
	creditedInvoiceNumber: string | undefined;
	/** Pour la Platform : de qui est la facture. */
	payer: Payer;
};

export type ChargeToInvoice = {
	payer: Payer;
	/** Les lignes hors taxes ; la TVA s'ajoute. */
	lines: readonly InvoiceLine[];
	description: string;
	periodStart: Date | undefined;
	periodEnd: Date | undefined;
	paymentMethod: InvoicePaymentMethod;
	checkoutId?: string;
	/** Un prélèvement déjà fait chez le prestataire (renouvellement, relance). */
	storedCardPayment?: { subscriptionId: string; attemptNumber: number; providerPaymentReference: string };
};

/**
 * Prélève (par carte) ou réclame (virement) un montant, et émet sa facture. Une
 * carte est débitée tout de suite ; un virement laisse la facture « à régler ».
 */
export async function chargeAndInvoice(charge: ChargeToInvoice): Promise<Invoice | undefined> {
	if (computeSubtotalCents(charge) <= 0) return undefined;
	const customer = await describeInvoiceCustomer(charge.payer);
	return runWithBillingAccess(platformBillingAccess, (transaction) => chargeAndInvoiceInTransaction(transaction, charge, customer));
}

export type InvoiceCustomer = { name: string; addressLines: string[] };

/** Pour qui a déjà sa transaction (un événement d'abonnement) : le client se lit avant de l'ouvrir. */
export async function chargeAndInvoiceInTransaction(
	transaction: BillingTransaction,
	charge: ChargeToInvoice,
	customer: InvoiceCustomer
): Promise<Invoice | undefined> {
	const subtotalCents = computeSubtotalCents(charge);
	if (subtotalCents <= 0) return undefined;
	const amounts = addVat(subtotalCents);
	const now = new Date();
	const paymentId = charge.paymentMethod === 'card' ? crypto.randomUUID() : undefined;
	if (paymentId) {
		const [insertedPayment] = await transaction
			.insert(payments)
			.values({
				id: paymentId,
				...toPayerColumns(charge.payer),
				checkoutId: charge.checkoutId ?? null,
				subscriptionId: charge.storedCardPayment?.subscriptionId ?? null,
				attemptNumber: charge.storedCardPayment?.attemptNumber ?? null,
				amountCents: amounts.totalCents,
				description: charge.description,
				status: 'paid',
				providerPaymentReference:
					charge.storedCardPayment?.providerPaymentReference ??
					getPaymentProvider().createPaymentReference(charge.checkoutId ?? paymentId),
				paidAt: now
			})
			.onConflictDoNothing({ target: payments.providerPaymentReference })
			.returning({ id: payments.id });
		if (!insertedPayment) return undefined;
	}
	const [invoiceRow] = await transaction
		.insert(invoices)
		.values({
			id: crypto.randomUUID(),
			number: await takeNextInvoiceNumber(transaction, now),
			kind: 'invoice',
			...toPayerColumns(charge.payer),
			issuedAt: now,
			periodStart: charge.periodStart ?? null,
			periodEnd: charge.periodEnd ?? null,
			customerName: customer.name,
			customerAddressLines: customer.addressLines,
			lines: [...charge.lines],
			...amounts,
			vatRatePercent,
			status: paymentId ? 'paid' : 'due',
			paymentMethod: charge.paymentMethod,
			paymentId: paymentId ?? null,
			paidAt: paymentId ? now : null
		})
		.returning();
	return invoiceRow && toInvoice(invoiceRow);
}

function computeSubtotalCents(charge: ChargeToInvoice): number {
	return charge.lines.reduce((total, line) => total + line.amountCents, 0);
}

/** Rembourse une facture payée par carte : un avoir l'annule, et la carte est recréditée. */
export async function creditInvoice(transaction: BillingTransaction, invoiceId: string): Promise<number> {
	const [invoiceRow] = await transaction.select().from(invoices).where(eq(invoices.id, invoiceId));
	if (!invoiceRow || invoiceRow.kind !== 'invoice' || invoiceRow.status === 'credited') return 0;
	const now = new Date();
	if (invoiceRow.paymentId) {
		const [payment] = await transaction.select().from(payments).where(eq(payments.id, invoiceRow.paymentId));
		if (payment) await getPaymentProvider().refundPayment(payment.providerPaymentReference, payment.amountCents);
		await transaction.update(payments).set({ status: 'refunded', refundedAt: now }).where(eq(payments.id, invoiceRow.paymentId));
	}
	await transaction.insert(invoices).values({
		...invoiceRow,
		id: crypto.randomUUID(),
		number: await takeNextInvoiceNumber(transaction, now),
		kind: 'credit_note',
		issuedAt: now,
		lines: invoiceRow.lines.map((line) => ({ ...line, amountCents: -line.amountCents })),
		subtotalCents: -invoiceRow.subtotalCents,
		vatCents: -invoiceRow.vatCents,
		totalCents: -invoiceRow.totalCents,
		status: 'paid',
		paymentId: null,
		creditedInvoiceId: invoiceRow.id,
		creditedInvoiceNumber: invoiceRow.number,
		paidAt: now
	});
	await transaction.update(invoices).set({ status: 'credited' }).where(eq(invoices.id, invoiceRow.id));
	return invoiceRow.totalCents;
}

export function listInvoices(payer: Payer): Promise<Invoice[]> {
	return runWithBillingAccess(toPayerAccess(payer), async (transaction) => {
		const invoiceRows = await transaction
			.select()
			.from(invoices)
			.where('tenantId' in payer ? eq(invoices.tenantId, payer.tenantId) : eq(invoices.groupId, payer.groupId))
			.orderBy(desc(invoices.issuedAt), desc(invoices.number));
		return invoiceRows.map(toInvoice);
	});
}

export async function getInvoice(payer: Payer, invoiceId: string): Promise<Invoice | undefined> {
	if (!isUuid(invoiceId)) return undefined;
	const [invoiceRow] = await runWithBillingAccess(toPayerAccess(payer), (transaction) =>
		transaction
			.select()
			.from(invoices)
			.where(
				and(
					eq(invoices.id, invoiceId),
					'tenantId' in payer ? eq(invoices.tenantId, payer.tenantId) : eq(invoices.groupId, payer.groupId)
				)
			)
	);
	return invoiceRow && toInvoice(invoiceRow);
}

/** Toutes les factures, pour la Platform. */
export function listAllInvoices(): Promise<Invoice[]> {
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const invoiceRows = await transaction.select().from(invoices).orderBy(desc(invoices.issuedAt), desc(invoices.number));
		return invoiceRows.map(toInvoice);
	});
}

export async function getInvoiceForPlatform(invoiceId: string): Promise<Invoice | undefined> {
	if (!isUuid(invoiceId)) return undefined;
	const [invoiceRow] = await runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction.select().from(invoices).where(eq(invoices.id, invoiceId))
	);
	return invoiceRow && toInvoice(invoiceRow);
}

/** La Platform a reçu le virement d'une facture « à régler ». */
export async function markInvoicePaid(invoiceId: string): Promise<void> {
	if (!isUuid(invoiceId)) return;
	await runWithBillingAccess(platformBillingAccess, (transaction) =>
		transaction
			.update(invoices)
			.set({ status: 'paid', paidAt: new Date() })
			.where(and(eq(invoices.id, invoiceId), eq(invoices.status, 'due')))
	);
}

// Une numérotation continue par année, sans trou : la ligne de l'année est
// verrouillée le temps de la transaction.
async function takeNextInvoiceNumber(transaction: BillingTransaction, issuedAt: Date): Promise<string> {
	const year = issuedAt.getFullYear();
	const [sequence] = await transaction
		.insert(invoiceSequences)
		.values({ year, lastNumber: 1 })
		.onConflictDoUpdate({ target: invoiceSequences.year, set: { lastNumber: sql`${invoiceSequences.lastNumber} + 1` } })
		.returning();
	return `CP-${year}-${String(sequence?.lastNumber ?? 1).padStart(5, '0')}`;
}

export async function describeInvoiceCustomer(payer: Payer): Promise<InvoiceCustomer> {
	if ('tenantId' in payer) {
		const pharmacyProfile = await getPharmacyProfile(payer.tenantId);
		return {
			name: pharmacyProfile.name,
			addressLines: [pharmacyProfile.street, `${pharmacyProfile.postalCode} ${pharmacyProfile.city}`]
		};
	}
	const group = await getPharmacyGroupForPlatform(payer.groupId);
	return { name: group?.name ?? 'Groupement', addressLines: group?.contactEmail ? [group.contactEmail] : [] };
}

// Un identifiant venu d'une URL : Postgres refuserait de le comparer à une colonne uuid.
function isUuid(candidate: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate);
}

function toPayerColumns(payer: Payer) {
	return { tenantId: 'tenantId' in payer ? payer.tenantId : null, groupId: 'groupId' in payer ? payer.groupId : null };
}

function toInvoice(invoiceRow: typeof invoices.$inferSelect): Invoice {
	return {
		invoiceId: invoiceRow.id,
		number: invoiceRow.number,
		kind: invoiceRow.kind,
		issuedAt: invoiceRow.issuedAt,
		periodStart: invoiceRow.periodStart ?? undefined,
		periodEnd: invoiceRow.periodEnd ?? undefined,
		customerName: invoiceRow.customerName,
		customerAddressLines: invoiceRow.customerAddressLines,
		lines: invoiceRow.lines,
		subtotalCents: invoiceRow.subtotalCents,
		vatRatePercent: invoiceRow.vatRatePercent,
		vatCents: invoiceRow.vatCents,
		totalCents: invoiceRow.totalCents,
		status: invoiceRow.status,
		paymentMethod: invoiceRow.paymentMethod,
		paidAt: invoiceRow.paidAt ?? undefined,
		creditedInvoiceNumber: invoiceRow.creditedInvoiceNumber ?? undefined,
		payer: invoiceRow.tenantId ? { tenantId: invoiceRow.tenantId } : { groupId: invoiceRow.groupId ?? '' }
	};
}
