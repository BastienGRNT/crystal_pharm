import { createAuthClient } from 'better-auth/client';
import { emailOTPClient, inferAdditionalFields, usernameClient } from 'better-auth/client/plugins';
import { personNameFields } from '../toolkit/personNameFields';
import { authenticationFailureMessages, identifyFailureReason, type BetterAuthClientError } from './authenticationFailures';

// Sans `baseURL`, le client parle au Better Auth du domaine courant : chaque
// app (pharmacy, group, admin) atteint ainsi sa propre identité.
const betterAuthClient = createAuthClient({
	plugins: [inferAdditionalFields({ user: personNameFields }), usernameClient(), emailOTPClient()]
});

/** La page où saisir le code reçu par email (cf. `registerAndOpen`). */
export const emailVerificationPathname = '/verification-email';

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
	if (error?.code === emailNotVerifiedCode) return openEmailVerification(identifier, destinationPathname);
	return openOrDescribeFailure(error, destinationPathname);
}

/**
 * Ouvre `destinationPathname` en cas de succès, sinon renvoie le message d'échec. Le serveur
 * remet en forme le prénom et le nom (cf. `enforceAccountRules`) et recalcule le `name`.
 * Quand l'email doit être vérifié, aucune session ne s'ouvre : on passe d'abord par la page du code.
 */
export async function registerAndOpen(newAccount: NewAccount, destinationPathname: string): Promise<string | undefined> {
	const { data, error } = await betterAuthClient.signUp.email({
		...newAccount,
		name: `${newAccount.firstName} ${newAccount.lastName}`
	});
	if (!error && data?.token === null) return openEmailVerification(newAccount.email, destinationPathname);
	return openOrDescribeFailure(error, destinationPathname);
}

/** Vérifie le code reçu par email : le compte s'ouvre puis `destinationPathname` aussi, sinon le message d'échec. */
export async function verifyEmailAndOpen(
	verification: { email: string; code: string },
	destinationPathname: string
): Promise<string | undefined> {
	const { error } = await betterAuthClient.emailOtp.verifyEmail({ email: verification.email, otp: verification.code });
	return openOrDescribeFailure(error, destinationPathname);
}

/** Renvoie un code neuf par email (l'ancien ne vaut plus). Renvoie le message d'échec, s'il y en a un. */
export async function resendVerificationCode(email: string): Promise<string | undefined> {
	const { error } = await betterAuthClient.emailOtp.sendVerificationOtp({ email, type: 'email-verification' });
	return error ? authenticationFailureMessages[identifyFailureReason(error)] : undefined;
}

const emailNotVerifiedCode = 'EMAIL_NOT_VERIFIED';

function openEmailVerification(email: string, destinationPathname: string): undefined {
	openPage(`${emailVerificationPathname}?${new URLSearchParams({ email, redirectTo: destinationPathname })}`);
	return undefined;
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
