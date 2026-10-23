import { listAllTenantSummaries, type TenantSummary } from '@crystal-pharm/pharmacy-db';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';
import { readToolAccessOfTenant } from '../subscriptions/tenantSubscriptions.server';
import type { ToolKey } from '../tools/tools';

/** `group` : au moins un Tool pris en charge · `subscribed` : abonnée seule · `inactive` : rien d'actif. */
export type TenantBillingStatus = 'group' | 'subscribed' | 'inactive';

export type TenantBilling = TenantSummary & {
	status: TenantBillingStatus;
	groupName: string | undefined;
	activeToolKeys: ToolKey[];
	pharmacyMonthlyPaymentCents: number;
	groupMonthlyPaymentCents: number;
};

/** Toutes les pharmacies et ce qu'elles rapportent, pour la Platform. */
export async function listTenantBillings(): Promise<TenantBilling[]> {
	const tenantSummaries = await listAllTenantSummaries();
	const now = new Date();
	return Promise.all(
		tenantSummaries.map((tenantSummary) =>
			runWithBillingAccess(platformBillingAccess, async (transaction) => {
				const toolAccess = await readToolAccessOfTenant(transaction, tenantSummary.tenantId, now);
				const hasGroupCoverage = (toolAccess.coveringGroup?.coverages.length ?? 0) > 0;
				const status: TenantBillingStatus = hasGroupCoverage
					? 'group'
					: toolAccess.accessibleToolKeys.length > 0
						? 'subscribed'
						: 'inactive';
				return {
					...tenantSummary,
					status,
					groupName: toolAccess.coveringGroup?.groupName,
					activeToolKeys: toolAccess.accessibleToolKeys,
					pharmacyMonthlyPaymentCents: toolAccess.quote.pharmacyMonthlyTotalCents,
					groupMonthlyPaymentCents: toolAccess.quote.groupMonthlyTotalCents
				};
			})
		)
	);
}
