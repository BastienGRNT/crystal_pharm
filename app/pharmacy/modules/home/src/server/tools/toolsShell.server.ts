import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';
import { getToolAccessSummary } from '@crystal-pharm/billing-db';
import type { OverduePayment, ToolKey } from '@crystal-pharm/billing-db/domain';
import { listPendingInvitationsForAccountEmail } from '@crystal-pharm/group-db';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { canManageSubscriptionAndAccess, type ResponsibilityKey } from '@crystal-pharm/pharmacy-db/domain';
import { keepToolsPermittedToMember } from '../../domain/toolResponsibilities';
import { homePathnames } from '../../homePathnames';
import { requireActiveTenantMember } from '../activeTenant.server';

export type ToolsShellData = {
	signedInMember: SignedInUserSummary;
	pharmacyName: string;
	isOpeningScheduleMissing: boolean;
	/** Les Tools ouverts à la pharmacie et permis au TenantMember : seuls ceux-là sont dans le menu. */
	accessibleToolKeys: ToolKey[];
	/** Défini quand les modules ne restent ouverts que par la grâce d'un paiement en retard. */
	overduePayment: OverduePayment | undefined;
	/** Ce que le menu montre des pages de la pharmacie (la fiche, l'abonnement). */
	responsibilityKeys: readonly ResponsibilityKey[];
	canManageSubscriptionAndAccess: boolean;
	/** Les liens du menu marqués d'un point : une fiche incomplète, une invitation sans réponse. */
	hrefsNeedingAttention: string[];
};

export async function loadToolsShell({
	locals
}: {
	locals: { user: AuthenticatedUser | null };
}): Promise<ToolsShellData> {
	const memberAccess = await requireActiveTenantMember(locals.user);
	const isOwner = canManageSubscriptionAndAccess(memberAccess);
	const [pharmacyProfile, toolAccessSummary, pendingInvitations] = await Promise.all([
		getPharmacyProfile(memberAccess.tenantId),
		getToolAccessSummary(memberAccess.tenantId, new Date()),
		isOwner ? listPendingInvitationsForAccountEmail(locals.user?.email ?? '') : []
	]);
	const isOpeningScheduleMissing = pharmacyProfile.weeklyOpeningSchedule === undefined;
	return {
		signedInMember: summarizeSignedInUser(locals.user),
		pharmacyName: pharmacyProfile.name,
		isOpeningScheduleMissing,
		accessibleToolKeys: keepToolsPermittedToMember(toolAccessSummary.accessibleToolKeys, memberAccess),
		overduePayment: toolAccessSummary.overduePayment,
		responsibilityKeys: memberAccess.responsibilityKeys,
		canManageSubscriptionAndAccess: isOwner,
		hrefsNeedingAttention: [
			...(isOpeningScheduleMissing && memberAccess.responsibilityKeys.includes('edit-pharmacy-profile') ? [homePathnames.pharmacy] : []),
			...(pendingInvitations.length > 0 ? [homePathnames.toolsHome] : [])
		]
	};
}
