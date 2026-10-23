import { listAllInvoices, listTenantBillings, type TenantBillingStatus } from '@crystal-pharm/billing-db';
import { loadGroupList, type GroupListItem } from '../groups/groupListPage.server';

export type AdminDashboardData = {
	groupCount: number;
	pharmacyCountByStatus: Record<TenantBillingStatus, number>;
	pharmacyCount: number;
	/** Ce qui rentre chaque mois : les abonnements des pharmacies et les contrats des groupements. */
	pharmacyMonthlyRevenueCents: number;
	groupMonthlyRevenueCents: number;
	groupsAwaitingPayment: GroupListItem[];
	dueInvoiceCount: number;
	/** Les factures envoyées sur virement, pas encore réglées (TTC). */
	dueInvoiceTotalCents: number;
};

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
	const [tenantBillings, groups, invoices] = await Promise.all([listTenantBillings(), loadGroupList(), listAllInvoices()]);
	const dueInvoices = invoices.filter((invoice) => invoice.status === 'due');
	const pharmacyCountByStatus: Record<TenantBillingStatus, number> = { group: 0, subscribed: 0, inactive: 0 };
	for (const tenantBilling of tenantBillings) pharmacyCountByStatus[tenantBilling.status] += 1;
	return {
		groupCount: groups.length,
		pharmacyCountByStatus,
		pharmacyCount: tenantBillings.length,
		pharmacyMonthlyRevenueCents: tenantBillings.reduce((total, tenantBilling) => total + tenantBilling.pharmacyMonthlyPaymentCents, 0),
		groupMonthlyRevenueCents: groups
			.filter((group) => group.contract?.status === 'active')
			.reduce((total, group) => total + group.groupMonthlyCostCents, 0),
		groupsAwaitingPayment: groups.filter((group) => group.contract?.status !== 'active'),
		dueInvoiceCount: dueInvoices.length,
		dueInvoiceTotalCents: dueInvoices.reduce((total, invoice) => total + invoice.totalCents, 0)
	};
}
