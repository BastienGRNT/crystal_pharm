import { getGroupBillingOverview, listPayments, requestGroupContractPayment, type GroupContract, type Payment } from '@crystal-pharm/billing-db';
import type { ToolCatalog } from '@crystal-pharm/billing-db/domain';
import { getPharmacyGroup } from '@crystal-pharm/group-db';
import { fail, redirect, type ActionFailure, type RequestEvent } from '@sveltejs/kit';
import { groupPathnames } from '$lib/groupPathnames';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

export type ContractPageData = {
	groupName: string;
	memberPharmacyCount: number;
	contract: GroupContract | undefined;
	catalog: ToolCatalog;
	groupMonthlyCostCents: number;
	payments: Payment[];
};

export async function loadContractPage({ locals }: { locals: App.Locals }): Promise<ContractPageData> {
	const groupId = await requireActiveGroupId(locals.user);
	const [group, billing, payments] = await Promise.all([
		getPharmacyGroup(groupId),
		getGroupBillingOverview({ groupId }, groupId),
		listPayments({ groupId })
	]);
	return {
		groupName: group.name,
		memberPharmacyCount: group.memberPharmacyCount,
		contract: billing.contract,
		catalog: billing.catalog,
		groupMonthlyCostCents: billing.groupMonthlyCostCents,
		payments
	};
}

export const contractPageActions = {
	payByCard: async ({ locals }: RequestEvent): Promise<ActionFailure<{ failureMessage: string }>> => {
		const groupId = await requireActiveGroupId(locals.user);
		const paymentRequest = await requestGroupContractPayment(groupId, groupPathnames.contract);
		if (paymentRequest.outcome === 'refused') return fail(400, { failureMessage: paymentRequest.failureMessage });
		redirect(303, paymentRequest.checkoutLocation);
	}
};
