import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveTenantMemberAccess } from '@crystal-pharm/pharmacy-db';
import {
	canManageSubscriptionAndAccess,
	hasResponsibility,
	type ResponsibilityKey,
	type TenantMemberAccess
} from '@crystal-pharm/pharmacy-db/domain';
import { error, redirect } from '@sveltejs/kit';
import { homePathnames } from '../homePathnames';

export function requireSignedInAccountId(user: AuthenticatedUser | null): string {
	// Les hooks redirigent vers la connexion avant d'atteindre une page protégée.
	if (!user) throw new Error('This page requires a signed-in user.');
	return user.userId;
}

/** Ce que le compte peut faire dans le Tenant de la session ; un compte sans pharmacie est envoyé la créer. */
export async function requireActiveTenantMember(user: AuthenticatedUser | null): Promise<TenantMemberAccess> {
	const memberAccess = await findActiveTenantMemberAccess(requireSignedInAccountId(user));
	if (!memberAccess) redirect(303, homePathnames.contactDetailsStep);
	return memberAccess;
}

/** Le Tenant de la session, pour un TenantMember qui a cette Responsibility ; sinon, refusé. */
export async function requireResponsibility(
	user: AuthenticatedUser | null,
	responsibilityKey: ResponsibilityKey
): Promise<TenantMemberAccess> {
	const memberAccess = await requireActiveTenantMember(user);
	if (!hasResponsibility(memberAccess, responsibilityKey)) error(403, 'Votre compte n’a pas accès à cette page.');
	return memberAccess;
}

/** L'abonnement et la gestion des accès : réservés aux Owners. */
export async function requireOwner(user: AuthenticatedUser | null): Promise<TenantMemberAccess> {
	const memberAccess = await requireActiveTenantMember(user);
	if (!canManageSubscriptionAndAccess(memberAccess)) error(403, 'Seul un titulaire de la pharmacie a accès à cette page.');
	return memberAccess;
}
