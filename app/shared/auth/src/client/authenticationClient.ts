import { createAuthClient } from 'better-auth/client';
import { authenticationFailureMessages, identifyFailureReason, type BetterAuthClientError } from './authenticationFailures';

// Sans `baseURL`, le client parle au Better Auth du domaine courant : chaque
// app (pharmacy, group, admin) atteint ainsi sa propre identité.
const betterAuthClient = createAuthClient();

export type Credentials = { email: string; password: string };

export type NewAccount = Credentials & { name: string };

/** Ouvre `destinationPathname` en cas de succès, sinon renvoie le message d'échec. */
export async function signInAndOpen(credentials: Credentials, destinationPathname: string): Promise<string | undefined> {
	const { error } = await betterAuthClient.signIn.email(credentials);
	return openOrDescribeFailure(error, destinationPathname);
}

/** Ouvre `destinationPathname` en cas de succès, sinon renvoie le message d'échec. */
export async function registerAndOpen(newAccount: NewAccount, destinationPathname: string): Promise<string | undefined> {
	const { error } = await betterAuthClient.signUp.email(newAccount);
	return openOrDescribeFailure(error, destinationPathname);
}

export async function signOutAndOpen(destinationPathname: string): Promise<void> {
	await betterAuthClient.signOut();
	openPage(destinationPathname);
}

function openOrDescribeFailure(error: BetterAuthClientError | null, destinationPathname: string): string | undefined {
	if (error) return authenticationFailureMessages[identifyFailureReason(error)];

	openPage(destinationPathname);
	return undefined;
}

// Navigation complète plutôt que `goto` : la session change, on repart d'une
// page neuve, sans état client de l'ancienne session.
function openPage(pathname: string): void {
	window.location.assign(pathname);
}
