export type DevelopmentNoticeTone = 'success' | 'warning';

/** Ce qu'une action a fait, affiché une fois après la redirection. Jamais de donnée de santé : des compteurs au plus. */
export type DevelopmentNotice = { message: string; tone: DevelopmentNoticeTone };

/** Ce que l'outil demande aux cookies de SvelteKit : `dev-tools` ne dépend pas de SvelteKit. */
export type DevelopmentNoticeCookies = {
	get(name: string): string | undefined;
	set(name: string, value: string, options: { path: string; httpOnly: boolean; secure: boolean; sameSite: 'lax'; maxAge: number }): void;
	delete(name: string, options: { path: string; secure: boolean }): void;
};

const developmentNoticeCookieName = 'developer-notice';
const developmentNoticeLifetimeInSeconds = 60;
// En dev, `group` et `admin` sont en http sur un sous-domaine de localhost : SvelteKit y pose `Secure` par défaut, et tous les navigateurs ne le renvoient pas.
const isDevelopmentNoticeCookieSecure = false;

export function keepDevelopmentNotice(cookies: DevelopmentNoticeCookies, notice: DevelopmentNotice): void {
	cookies.set(developmentNoticeCookieName, JSON.stringify(notice), {
		path: '/',
		httpOnly: true,
		secure: isDevelopmentNoticeCookieSecure,
		sameSite: 'lax',
		maxAge: developmentNoticeLifetimeInSeconds
	});
}

/** Lu une seule fois : le cookie est effacé aussitôt. */
export function takeDevelopmentNotice(cookies: DevelopmentNoticeCookies): DevelopmentNotice | undefined {
	const storedNotice = cookies.get(developmentNoticeCookieName);
	if (!storedNotice) return undefined;
	cookies.delete(developmentNoticeCookieName, { path: '/', secure: isDevelopmentNoticeCookieSecure });
	return parseDevelopmentNotice(storedNotice);
}

function parseDevelopmentNotice(storedNotice: string): DevelopmentNotice | undefined {
	try {
		const parsed: unknown = JSON.parse(storedNotice);
		if (typeof parsed !== 'object' || parsed === null || !('message' in parsed) || typeof parsed.message !== 'string') return undefined;
		const tone = 'tone' in parsed && parsed.tone === 'warning' ? 'warning' : 'success';
		return { message: parsed.message, tone };
	} catch {
		return undefined;
	}
}
