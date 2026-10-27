import {
	acceptPharmacyInvitationInTransaction,
	leaveGroupInTransaction,
	removePharmacyFromGroupInTransaction,
	toAcceptanceAccess,
	type CoveringGroupOfTenant,
	type InvitationProof,
	type PharmacyInvitationAnswer
} from '@crystal-pharm/group-db';
import { rebuildToolAccessOfTenant } from '../access/rebuildToolAccessOfTenant.server';
import { platformBillingAccess, runWithBillingAccess } from '../database/billingDatabase.server';

/**
 * Événement : une pharmacie entre dans un groupement. L'adhésion et les accès
 * qu'elle ouvre (la prise en charge du contrat) sont écrits dans la même transaction.
 */
export function acceptPharmacyInvitationAndRebuildToolAccess(
	tenantId: string,
	proof: InvitationProof,
	now: Date = new Date()
): Promise<PharmacyInvitationAnswer> {
	return runWithBillingAccess(toAcceptanceAccess(tenantId, proof), async (transaction) => {
		const answer = await acceptPharmacyInvitationInTransaction(transaction, tenantId, proof);
		if (answer.isAnswered) await rebuildToolAccessOfTenant(transaction, tenantId, now);
		return answer;
	});
}

/** Événement : la pharmacie quitte son groupement ; la prise en charge court jusqu'à la fin du mois. */
export function leaveGroupAndRebuildToolAccess(
	tenantId: string,
	now: Date = new Date()
): Promise<CoveringGroupOfTenant | undefined> {
	return runWithBillingAccess({ tenantId }, async (transaction) => {
		const coveringGroup = await leaveGroupInTransaction(transaction, tenantId);
		if (coveringGroup) await rebuildToolAccessOfTenant(transaction, tenantId, now);
		return coveringGroup;
	});
}

/**
 * Événement : le groupement retire une de ses pharmacies. L'accès est celui de
 * la Platform parce que le Tenant n'est connu qu'une fois l'adhésion trouvée ;
 * l'adhésion reste cherchée dans le groupement de l'appelant (`groupId`).
 */
export function removePharmacyFromGroupAndRebuildToolAccess(
	groupId: string,
	membershipId: string,
	now: Date = new Date()
): Promise<CoveringGroupOfTenant | undefined> {
	return runWithBillingAccess(platformBillingAccess, async (transaction) => {
		const endedMembership = await removePharmacyFromGroupInTransaction(transaction, groupId, membershipId);
		if (!endedMembership) return undefined;
		await rebuildToolAccessOfTenant(transaction, endedMembership.tenantId, now);
		return endedMembership;
	});
}
