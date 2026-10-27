export type AuthenticatedUser = {
	userId: string;
	name: string;
	email: string;
	/** L'identifiant du CounterAccount, qui n'a pas d'email à montrer. */
	username?: string | undefined;
};

declare global {
	namespace App {
		interface Locals {
			user: AuthenticatedUser | null;
		}
	}
}

export type SignedInUserSummary = {
	name: string;
	detail: string;
};

export function summarizeSignedInUser(user: AuthenticatedUser | null): SignedInUserSummary {
	// Les hooks redirigent vers la connexion avant d'atteindre une page protégée.
	if (!user) throw new Error('This page requires a signed-in user.');
	return { name: user.name, detail: user.username ?? user.email };
}
