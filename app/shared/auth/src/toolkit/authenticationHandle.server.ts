import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import type { BetterAuthOptions } from 'better-auth';
import { isAuthPath } from 'better-auth/svelte-kit';
import type { AuthenticatedUser } from './authenticatedUser';

export type BetterAuthForHandle = {
	handler: (request: Request) => Promise<Response>;
	options: BetterAuthOptions;
	api: {
		getSession: (context: {
			headers: Headers;
		}) => Promise<{ user: { id: string; name: string; email: string; username?: string | null } } | null>;
	};
};

export type AuthenticationRedirects = {
	loginPathname: string;
	signedInHomePathname: string;
	anonymousOnlyPathnames: readonly string[];
	/** Ouverts à tous, connecté ou non : une invitation, l'outil de dev. */
	publicPathnamePrefixes?: readonly string[];
};

export function createAuthenticationHandle(
	getBetterAuth: () => BetterAuthForHandle,
	authenticationRedirects: AuthenticationRedirects
): Handle {
	return sequence(authenticateRequest(getBetterAuth), redirectByAuthenticationState(authenticationRedirects));
}

function authenticateRequest(getBetterAuth: () => BetterAuthForHandle): Handle {
	return async ({ event, resolve }) => {
		const betterAuth = getBetterAuth();
		redirectToCanonicalOrigin(event.url, betterAuth.options);
		if (isAuthPath(event.url.toString(), betterAuth.options)) return betterAuth.handler(event.request);

		event.locals.user = await findAuthenticatedUser(betterAuth, event.request.headers);
		return resolve(event);
	};
}

// Le cookie de session et les vérifications d'origine de Better Auth ne valent
// que pour son domaine : `localhost:5174` est renvoyé vers `groupement.localhost:5174`.
function redirectToCanonicalOrigin(requestUrl: URL, betterAuthOptions: BetterAuthOptions): void {
	if (typeof betterAuthOptions.baseURL !== 'string') return;

	const canonicalOrigin = new URL(betterAuthOptions.baseURL).origin;
	if (requestUrl.origin !== canonicalOrigin) {
		redirect(308, `${canonicalOrigin}${requestUrl.pathname}${requestUrl.search}`);
	}
}

async function findAuthenticatedUser(
	betterAuth: BetterAuthForHandle,
	requestHeaders: Headers
): Promise<AuthenticatedUser | null> {
	const authenticatedSession = await betterAuth.api.getSession({ headers: requestHeaders });
	if (!authenticatedSession) return null;

	const { user } = authenticatedSession;
	return { userId: user.id, name: user.name, email: user.email, username: user.username ?? undefined };
}

function redirectByAuthenticationState({
	loginPathname,
	signedInHomePathname,
	anonymousOnlyPathnames,
	publicPathnamePrefixes = []
}: AuthenticationRedirects): Handle {
	return ({ event, resolve }) => {
		const isPublicPathname = publicPathnamePrefixes.some((pathnamePrefix) =>
			event.url.pathname.startsWith(pathnamePrefix)
		);
		if (isPublicPathname) return resolve(event);

		const isSignedIn = event.locals.user !== null;
		const isAnonymousOnlyPathname = anonymousOnlyPathnames.includes(event.url.pathname);

		if (isSignedIn && isAnonymousOnlyPathname) redirect(303, signedInHomePathname);
		if (!isSignedIn && !isAnonymousOnlyPathname) redirect(303, withReturnPathname(loginPathname, event.url));

		return resolve(event);
	};
}

// Après la connexion, on revient sur la page demandée (un lien d'invitation…).
function withReturnPathname(loginPathname: string, requestedUrl: URL): string {
	if (requestedUrl.pathname === '/') return loginPathname;
	const returnPathname = `${requestedUrl.pathname}${requestedUrl.search}`;
	return `${loginPathname}?${new URLSearchParams({ redirectTo: returnPathname })}`;
}
