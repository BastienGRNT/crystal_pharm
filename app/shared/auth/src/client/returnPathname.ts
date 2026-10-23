/**
 * La page où revenir après la connexion (`?redirectTo=`), seulement si c'est
 * une page du même domaine : jamais une adresse qui mènerait ailleurs.
 */
export function readReturnPathname(pageUrl: URL, fallbackPathname: string): string {
	const requestedPathname = pageUrl.searchParams.get('redirectTo');
	const isSameOriginPathname =
		requestedPathname !== null && requestedPathname.startsWith('/') && !requestedPathname.startsWith('//');
	return isSameOriginPathname ? requestedPathname : fallbackPathname;
}
