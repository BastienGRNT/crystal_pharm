import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantIdOfAccount } from '@crystal-pharm/pharmacy-db';
import { redirect } from '@sveltejs/kit';
import type { BookingCaller } from './api/bookingApiClient.server';

/** Le Manager de la session et son Tenant actif ; sans pharmacie, l'accueil envoie la créer. */
export async function requireBookingCaller(user: AuthenticatedUser | null): Promise<BookingCaller> {
	// Les hooks de `pharmacy/host` redirigent vers la connexion avant d'atteindre les rendez-vous.
	if (!user) throw new Error('The appointments require a signed-in user.');
	const tenantId = await findActiveTenantIdOfAccount(user.userId);
	if (!tenantId) redirect(303, '/');
	return { accountId: user.userId, tenantId };
}
