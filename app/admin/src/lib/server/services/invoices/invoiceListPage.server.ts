import { listAllInvoices, markInvoicePaid, toInvoiceRow, type InvoiceRow } from '@crystal-pharm/billing-db';
import type { RequestEvent } from '@sveltejs/kit';

export type InvoiceListFilter = 'all' | 'due';

export type InvoiceListPageData = {
	filter: InvoiceListFilter;
	invoices: InvoiceRow[];
	dueInvoiceCount: number;
	/** Ce qui reste à encaisser par virement, TTC. */
	dueTotalCents: number;
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
		dueTotalCents: dueInvoices.reduce((total, invoice) => total + invoice.totalCents, 0)
	};
}

export const invoiceListPageActions = {
	markPaid: async ({ request }: RequestEvent): Promise<InvoiceListActionResult> => {
		const formData = await request.formData();
		await markInvoicePaid(String(formData.get('invoiceId') ?? ''));
		return { paidInvoiceNumber: String(formData.get('invoiceNumber') ?? '') };
	}
};
