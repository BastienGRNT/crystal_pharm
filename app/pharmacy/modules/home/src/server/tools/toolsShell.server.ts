import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';
import { getToolAccessSummary } from '@crystal-pharm/billing-db';
import type { OverduePayment, ToolKey } from '@crystal-pharm/billing-db/domain';
import { listPendingInvitationsForAccountEmail } from '@crystal-pharm/group-db';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { homePathnames } from '../../homePathnames';
import { requireActiveTenantId } from '../activeTenant.server';

export type ToolsShellData = {
	signedInManager: SignedInUserSummary;
	pharmacyName: string;
	isOpeningScheduleMissing: boolean;
	/** Les Tools ouverts à la pharmacie : seuls ceux-là sont dans le menu. */
	accessibleToolKeys: ToolKey[];
	/** Défini quand les modules ne restent ouverts que par la grâce d'un paiement en retard. */
	overduePayment: OverduePayment | undefined;
	/** Les liens du menu marqués d'un point : une fiche incomplète, une invitation sans réponse. */
	hrefsNeedingAttention: string[];
};

export async function loadToolsShell({
	locals
}: {
	locals: { user: AuthenticatedUser | null };
}): Promise<ToolsShellData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const [pharmacyProfile, toolAccessSummary, pendingInvitations] = await Promise.all([
		getPharmacyProfile(tenantId),
		getToolAccessSummary(tenantId, new Date()),
		listPendingInvitationsForAccountEmail(locals.user?.email ?? '')
	]);
	const isOpeningScheduleMissing = pharmacyProfile.weeklyOpeningSchedule === undefined;
	return {
		signedInManager: summarizeSignedInUser(locals.user),
		pharmacyName: pharmacyProfile.name,
		isOpeningScheduleMissing,
		accessibleToolKeys: toolAccessSummary.accessibleToolKeys,
		overduePayment: toolAccessSummary.overduePayment,
		hrefsNeedingAttention: [
			...(isOpeningScheduleMissing ? [homePathnames.pharmacy] : []),
			...(pendingInvitations.length > 0 ? [homePathnames.toolsHome] : [])
		]
	};
}
