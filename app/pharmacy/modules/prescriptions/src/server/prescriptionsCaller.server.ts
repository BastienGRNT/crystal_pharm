import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { redirect } from '@sveltejs/kit';
import type { PrescriptionsCaller } from './api/prescriptionsApiClient.server';

/** Le Manager de la session et son Tenant actif ; sans pharmacie, l'accueil envoie la créer. */
export async function requirePrescriptionsCaller(user: AuthenticatedUser | null): Promise<PrescriptionsCaller> {
	// Les hooks de `pharmacy/host` redirigent vers la connexion avant d'atteindre les ordonnances.
	if (!user) throw new Error('The prescriptions require a signed-in user.');
	const tenantId = await findActiveTenantIdOfAccount(user.userId);
	if (!tenantId) redirect(303, '/');
	return { accountId: user.userId, tenantId };
}
