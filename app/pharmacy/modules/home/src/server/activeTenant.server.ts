import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { redirect } from '@sveltejs/kit';
import { homePathnames } from '../homePathnames';

export function requireSignedInAccountId(user: AuthenticatedUser | null): string {
	// Les hooks redirigent vers la connexion avant d'atteindre une page protégée.
	if (!user) throw new Error('This page requires a signed-in user.');
	return user.userId;
}

/** Le Tenant de la session ; un compte sans pharmacie est envoyé la créer. */
export async function requireActiveTenantId(user: AuthenticatedUser | null): Promise<string> {
	const tenantId = await findActiveTenantIdOfAccount(requireSignedInAccountId(user));
	if (!tenantId) redirect(303, homePathnames.contactDetailsStep);
	return tenantId;
}
