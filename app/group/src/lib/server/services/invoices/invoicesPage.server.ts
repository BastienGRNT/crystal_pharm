import { getGroupBillingOverview, listInvoices, toInvoiceRow, type InvoiceRow, type UpcomingCharge } from '@crystal-pharm/billing-db';
import type { GroupPaymentMethod } from '@crystal-pharm/billing-db/domain';
import { getPharmacyGroup } from '@crystal-pharm/group-db';
import { invoicePdfPathname } from '$lib/groupPathnames';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

export type InvoicesPageData = {
	groupName: string;
	paymentMethod: GroupPaymentMethod | undefined;
	upcomingCharge: UpcomingCharge | undefined;
	invoices: InvoiceRow[];
	/** Les factures envoyées sur virement, pas encore réglées (TTC). */
	dueTotalCents: number;
};

export async function loadInvoicesPage({ locals }: { locals: App.Locals }): Promise<InvoicesPageData> {
	const groupId = await requireActiveGroupId(locals.user);
	const [group, billing, invoices] = await Promise.all([
		getPharmacyGroup(groupId),
		getGroupBillingOverview({ groupId }, groupId),
		listInvoices({ groupId })
	]);
	return {
		groupName: group.name,
		paymentMethod: billing.contract?.paymentMethod,
		upcomingCharge: billing.upcomingCharge,
		invoices: invoices.map((invoice) => toInvoiceRow(invoice, invoicePdfPathname(invoice.invoiceId))),
		dueTotalCents: invoices
			.filter((invoice) => invoice.status === 'due')
			.reduce((total, invoice) => total + invoice.totalCents, 0)
	};
}
