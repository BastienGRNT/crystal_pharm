import { listAllInvoices, markInvoicePaid, toInvoiceRow, type InvoiceRow } from '@crystal-pharm/billing-db';
import type { RequestEvent } from '@sveltejs/kit';

export type InvoiceListFilter = 'all' | 'due';

export type InvoiceListPageData = {
	filter: InvoiceListFilter;
	invoices: InvoiceRow[];
	dueInvoiceCount: number;
	/** Ce qui reste à encaisser par virement, TTC. */
	dueTotalCents: number;
	/** Factures moins avoirs émis depuis le 1er du mois, HT : le chiffre d'affaires du mois en cours. */
	currentMonthInvoicedSubtotalCents: number;
	currentMonthLabel: string;
};

export type InvoiceListActionResult = { paidInvoiceNumber: string };

export const dueFilterSearchParameter = 'a-regler';

export function invoicePdfPathname(invoiceId: string): string {
	return `/factures/${invoiceId}/pdf`;
}

export async function loadInvoiceListPage({ url }: { url: URL }): Promise<InvoiceListPageData> {
	const filter: InvoiceListFilter = url.searchParams.has(dueFilterSearchParameter) ? 'due' : 'all';
	const invoices = await listAllInvoices();
	const dueInvoices = invoices.filter((invoice) => invoice.status === 'due');
	return {
		filter,
		invoices: (filter === 'due' ? dueInvoices : invoices).map((invoice) => toInvoiceRow(invoice, invoicePdfPathname(invoice.invoiceId))),
		dueInvoiceCount: dueInvoices.length,
		dueTotalCents: dueInvoices.reduce((total, invoice) => total + invoice.totalCents, 0),
		currentMonthInvoicedSubtotalCents: sumSubtotalsIssuedSince(invoices, startOfCurrentMonth()),
		currentMonthLabel: monthFormat.format(new Date())
	};
}

const monthFormat = new Intl.DateTimeFormat('fr-FR', { month: 'long' });

function startOfCurrentMonth(): Date {
	const today = new Date();
	return new Date(today.getFullYear(), today.getMonth(), 1);
}

// Un avoir porte déjà un montant négatif : la somme donne le net.
function sumSubtotalsIssuedSince(invoices: readonly { issuedAt: Date; subtotalCents: number }[], since: Date): number {
	return invoices.filter((invoice) => invoice.issuedAt >= since).reduce((total, invoice) => total + invoice.subtotalCents, 0);
}

export const invoiceListPageActions = {
	markPaid: async ({ request }: RequestEvent): Promise<InvoiceListActionResult> => {
		const formData = await request.formData();
		await markInvoicePaid(String(formData.get('invoiceId') ?? ''));
		return { paidInvoiceNumber: String(formData.get('invoiceNumber') ?? '') };
	}
};
