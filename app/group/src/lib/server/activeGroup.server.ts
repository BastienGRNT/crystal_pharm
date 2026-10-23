import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { findActiveGroupIdOfAccount } from '@crystal-pharm/group-db';
import { redirect } from '@sveltejs/kit';
import { groupPathnames } from '$lib/groupPathnames';

export function requireSignedInUser(user: AuthenticatedUser | null): AuthenticatedUser {
	// Les hooks redirigent vers la connexion avant d'atteindre une page protégée.
	if (!user) throw new Error('This page requires a signed-in user.');
	return user;
}

/** Le groupement de la session : il vient des appartenances du compte, jamais d'un paramètre. */
export async function requireActiveGroupId(user: AuthenticatedUser | null): Promise<string> {
	const groupId = await findActiveGroupIdOfAccount(requireSignedInUser(user).userId);
	if (!groupId) redirect(303, groupPathnames.withoutGroup);
	return groupId;
}
