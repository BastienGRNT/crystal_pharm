import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';
import { getGroupContract } from '@crystal-pharm/billing-db';
import { getPharmacyGroup } from '@crystal-pharm/group-db';
import { groupPathnames } from '$lib/groupPathnames';
import { requireActiveGroupId } from './activeGroup.server';

export type GroupShellData = {
	signedInGroupMember: SignedInUserSummary;
	groupName: string;
	/** Les liens du menu marqués d'un point : un contrat à activer. */
	hrefsNeedingAttention: string[];
};

export async function loadGroupShell({ locals }: { locals: { user: AuthenticatedUser | null } }): Promise<GroupShellData> {
	const groupId = await requireActiveGroupId(locals.user);
	const [group, contract] = await Promise.all([getPharmacyGroup(groupId), getGroupContract({ groupId }, groupId)]);
	return {
		signedInGroupMember: summarizeSignedInUser(locals.user),
		groupName: group.name,
		hrefsNeedingAttention: contract?.status === 'awaiting_payment' ? [groupPathnames.contract] : []
	};
}
