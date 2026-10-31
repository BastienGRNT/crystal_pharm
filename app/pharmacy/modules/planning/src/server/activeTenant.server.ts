import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantIdOfAccount, findActiveTenantMemberAccess } from '@crystal-pharm/pharmacy-db';
import { hasResponsibility } from '@crystal-pharm/pharmacy-db/domain';
import { redirect } from '@sveltejs/kit';
import { managerPlanningResponsibilityKey } from './services/notifications/planningManagers';

/** Le Tenant de la session ; sans pharmacie, l'accueil envoie la créer. */
export async function requireActiveTenantId(user: AuthenticatedUser | null): Promise<string> {
	// Les hooks de `pharmacy/host` redirigent vers la connexion avant d'atteindre le planning.
	if (!user) throw new Error('The planning requires a signed-in user.');
	const tenantId = await findActiveTenantIdOfAccount(user.userId);
	if (!tenantId) redirect(303, '/');
	return tenantId;
}

/** Le planning de l'équipe et la validation des congés : un Owner, ou un TenantMember qui en a la Responsibility. */
export async function requirePlanningManager(user: AuthenticatedUser | null): Promise<{ tenantId: string; accountId: string }> {
	if (!user) throw new Error('The planning requires a signed-in user.');
	const access = await findActiveTenantMemberAccess(user.userId);
	if (!access) redirect(303, '/');
	if (!hasResponsibility(access, managerPlanningResponsibilityKey)) redirect(303, access.employeeId ? '/mon-planning' : '/');
	return { tenantId: access.tenantId, accountId: access.accountId };
}
