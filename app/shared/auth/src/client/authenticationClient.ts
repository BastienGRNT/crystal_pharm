import { createAuthClient } from 'better-auth/client';
import { inferAdditionalFields, usernameClient } from 'better-auth/client/plugins';
import { personNameFields } from '../toolkit/personNameFields';
import { authenticationFailureMessages, identifyFailureReason, type BetterAuthClientError } from './authenticationFailures';

// Sans `baseURL`, le client parle au Better Auth du domaine courant : chaque
// app (pharmacy, group, admin) atteint ainsi sa propre identité.
const betterAuthClient = createAuthClient({
	plugins: [inferAdditionalFields({ user: personNameFields }), usernameClient()]
});

export type Credentials = { email: string; password: string };

export type NewAccount = Credentials & { firstName: string; lastName: string };

/**
 * Ouvre `destinationPathname` en cas de succès, sinon renvoie le message d'échec. Sans `@`,
 * l'identifiant saisi est celui d'un CounterAccount, qui n'a pas d'email.
 */
export async function signInAndOpen(credentials: Credentials, destinationPathname: string): Promise<string | undefined> {
	const identifier = credentials.email.trim();
	const { error } = identifier.includes('@')
		? await betterAuthClient.signIn.email({ email: identifier, password: credentials.password })
		: await betterAuthClient.signIn.username({ username: identifier, password: credentials.password });
	return openOrDescribeFailure(error, destinationPathname);
}

/** Ouvre `destinationPathname` en cas de succès, sinon renvoie le message d'échec. */
export async function registerAndOpen(newAccount: NewAccount, destinationPathname: string): Promise<string | undefined> {
	const firstName = newAccount.firstName.trim();
	const lastName = newAccount.lastName.trim();
	const { error } = await betterAuthClient.signUp.email({
		...newAccount,
		firstName,
		lastName,
		name: `${firstName} ${lastName}`
	});
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
