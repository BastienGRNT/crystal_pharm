import { getGroupBillingOverview, platformBillingAccess, type GroupContract } from '@crystal-pharm/billing-db';
import { listPharmacyGroupsForPlatform, type PharmacyGroupSummary } from '@crystal-pharm/group-db';

export type GroupListItem = PharmacyGroupSummary & {
	contract: Pick<GroupContract, 'paymentMethod' | 'status' | 'billingMode' | 'billingPeriod'> | undefined;
	groupMonthlyCostCents: number;
};

export async function loadGroupList(): Promise<GroupListItem[]> {
	const groups = await listPharmacyGroupsForPlatform();
	return Promise.all(
		groups.map(async (group) => {
			const billingOverview = await getGroupBillingOverview(platformBillingAccess, group.groupId);
			return {
				...group,
				contract: billingOverview.contract && {
					paymentMethod: billingOverview.contract.paymentMethod,
					status: billingOverview.contract.status,
					billingMode: billingOverview.contract.billingMode,
					billingPeriod: billingOverview.contract.billingPeriod
				},
				groupMonthlyCostCents: billingOverview.groupMonthlyCostCents
			};
		})
	);
}
