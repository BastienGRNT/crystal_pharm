import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { redirect } from '@sveltejs/kit';

/** Le Tenant de la session ; sans pharmacie, l'accueil envoie la créer. */
export async function requireActiveTenantId(user: AuthenticatedUser | null): Promise<string> {
	// Les hooks de `pharmacy/host` redirigent vers la connexion avant d'atteindre le planning.
	if (!user) throw new Error('The planning requires a signed-in user.');
	const tenantId = await findActiveTenantIdOfAccount(user.userId);
	if (!tenantId) redirect(303, '/');
	return tenantId;
}
