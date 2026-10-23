import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';
import { getToolAccessOfTenant } from '@crystal-pharm/billing-db';
import type { ToolKey } from '@crystal-pharm/billing-db/domain';
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
	/** Les liens du menu marqués d'un point : une fiche incomplète, une invitation sans réponse. */
	hrefsNeedingAttention: string[];
};

export async function loadToolsShell({
	locals
}: {
	locals: { user: AuthenticatedUser | null };
}): Promise<ToolsShellData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const [pharmacyProfile, toolAccess, pendingInvitations] = await Promise.all([
		getPharmacyProfile(tenantId),
		getToolAccessOfTenant(tenantId),
		listPendingInvitationsForAccountEmail(locals.user?.email ?? '')
	]);
	const isOpeningScheduleMissing = pharmacyProfile.weeklyOpeningSchedule === undefined;
	return {
		signedInManager: summarizeSignedInUser(locals.user),
		pharmacyName: pharmacyProfile.name,
		isOpeningScheduleMissing,
		accessibleToolKeys: toolAccess.accessibleToolKeys,
		hrefsNeedingAttention: [
			...(isOpeningScheduleMissing ? [homePathnames.pharmacy] : []),
			...(pendingInvitations.length > 0 ? [homePathnames.toolsHome] : [])
		]
	};
}
