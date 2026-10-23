import {
	getGroupBillingOverview,
	listInvoices,
	requestGroupContractPayment,
	toInvoiceRow,
	type GroupContract,
	type InvoiceRow,
	type UpcomingCharge
} from '@crystal-pharm/billing-db';
import { addVat, priceForPeriod, type AmountsWithVat, type GroupCharge, type ToolCatalog } from '@crystal-pharm/billing-db/domain';
import { getPharmacyGroup } from '@crystal-pharm/group-db';
import { fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { groupPathnames, invoicePdfPathname } from '$lib/groupPathnames';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

export type ContractPageData = {
	groupName: string;
	memberPharmacyCount: number;
	pharmacyQuota: number;
	contract: GroupContract | undefined;
	catalog: ToolCatalog;
	/** Ce que le groupement paie chaque mois, HT. */
	charge: GroupCharge;
	/** Le premier paiement d'un contrat par carte : un mois ou un an, TVA comprise. */
	firstPayment: AmountsWithVat;
	upcomingCharge: UpcomingCharge | undefined;
	latestInvoices: InvoiceRow[];
};

const latestInvoiceCount = 3;

export async function loadContractPage({ locals }: { locals: App.Locals }): Promise<ContractPageData> {
	const groupId = await requireActiveGroupId(locals.user);
	const [group, billing, invoices] = await Promise.all([
		getPharmacyGroup(groupId),
		getGroupBillingOverview({ groupId }, groupId),
		listInvoices({ groupId })
	]);
	return {
		groupName: group.name,
		memberPharmacyCount: group.memberPharmacyCount,
		pharmacyQuota: group.pharmacyQuota,
		contract: billing.contract,
		catalog: billing.catalog,
		charge: billing.charge,
		firstPayment: addVat(
			priceForPeriod(billing.charge.monthlyTotalCents, billing.contract?.billingPeriod ?? 'monthly', billing.catalog.annualFreeMonths)
		),
		upcomingCharge: billing.upcomingCharge,
		latestInvoices: invoices
			.slice(0, latestInvoiceCount)
			.map((invoice) => toInvoiceRow(invoice, invoicePdfPathname(invoice.invoiceId)))
	};
}

export const contractPageActions = {
	payByCard: async ({ locals }: RequestEvent): Promise<ActionFailure<{ failureMessage: string }>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const paymentRequest = await requestGroupContractPayment(groupId, groupPathnames.contract);
		if (paymentRequest.outcome === 'refused') return fail(400, { failureMessage: paymentRequest.failureMessage });
		redirect(
			303,
			paymentRequest.outcome === 'checkout' ? paymentRequest.checkoutLocation : `${groupPathnames.contract}?paiement=reussi`
		);
	}
};
