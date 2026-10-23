import { getGroupBillingOverview, type GroupContract } from '@crystal-pharm/billing-db';
import type { ToolCatalog, ToolKey } from '@crystal-pharm/billing-db/domain';
import { getPharmacyGroup, listMemberPharmacies, type MemberPharmacy, type PharmacyGroupSummary } from '@crystal-pharm/group-db';
import { requireActiveGroupId } from '$lib/server/activeGroup.server';

export type GroupDashboardData = {
	group: PharmacyGroupSummary;
	contract: GroupContract | undefined;
	catalog: ToolCatalog;
	groupMonthlyCostCents: number;
	activePharmacyCountByToolKey: Partial<Record<ToolKey, number>>;
	latestMemberPharmacies: MemberPharmacy[];
};

export async function loadGroupDashboard({ locals }: { locals: App.Locals }): Promise<GroupDashboardData> {
	const groupId = await requireActiveGroupId(locals.user);
	const [group, billing, memberPharmacies] = await Promise.all([
		getPharmacyGroup(groupId),
		getGroupBillingOverview({ groupId }, groupId),
		listMemberPharmacies({ groupId }, groupId)
	]);
	return {
		group,
		contract: billing.contract,
		catalog: billing.catalog,
		groupMonthlyCostCents: billing.groupMonthlyCostCents,
		activePharmacyCountByToolKey: billing.activePharmacyCountByToolKey,
		latestMemberPharmacies: memberPharmacies.toSorted((first, second) => second.joinedAt.getTime() - first.joinedAt.getTime()).slice(0, 5)
	};
}
