import { summarizeSignedInUser, type AuthenticatedUser, type SignedInUserSummary } from '@crystal-pharm/auth';
import { getPharmacyProfile } from '@crystal-pharm/pharmacy-db';
import { homePathnames } from '../homePathnames';
import { requireActiveTenantId } from './activeTenant.server';

export type ToolsShellData = {
	signedInManager: SignedInUserSummary;
	pharmacyName: string;
	isOpeningScheduleMissing: boolean;
	/** Les liens du menu marqués d'un point, tant que la fiche n'est pas complète. */
	hrefsNeedingAttention: string[];
};

export async function loadToolsShell({
	locals
}: {
	locals: { user: AuthenticatedUser | null };
}): Promise<ToolsShellData> {
	const pharmacyProfile = await getPharmacyProfile(await requireActiveTenantId(locals.user));
	const isOpeningScheduleMissing = pharmacyProfile.weeklyOpeningSchedule === undefined;
	return {
		signedInManager: summarizeSignedInUser(locals.user),
		pharmacyName: pharmacyProfile.name,
		isOpeningScheduleMissing,
		hrefsNeedingAttention: isOpeningScheduleMissing ? [homePathnames.pharmacy] : []
	};
}
