export type Theme = 'light' | 'dark';

// Même clé que le script de app.html, qui pose le thème avant l'affichage.
const themeStorageKey = 'crystal-pharm-theme';

export function readCurrentTheme(): Theme {
	const forcedTheme = document.documentElement.dataset.theme;
	if (forcedTheme === 'light' || forcedTheme === 'dark') return forcedTheme;
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyAndRememberTheme(theme: Theme): void {
	document.documentElement.dataset.theme = theme;
	try {
		localStorage.setItem(themeStorageKey, theme);
	} catch {
		// Stockage bloqué (navigation privée) : le thème vaut pour cette page seulement.
	}
}
