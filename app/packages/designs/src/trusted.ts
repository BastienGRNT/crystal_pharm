/**
 * La frontière. Tout ce qui vient d'un gérant (aujourd'hui des mocks, demain
 * l'API C#) entre ici en `unknown` et n'en ressort que scellé.
 *
 * Un composant de section ne peut pas fabriquer de `Trusted<T>` : le symbole
 * qui le marque n'est exporté nulle part. Le seul producteur est `seal()`,
 * appelé uniquement par les analyseurs de `src/sections/`. Un design qui
 * importe ce fichier est refusé par `tools/assemble.mjs`.
 */

declare const sealed: unique symbol;

/** Une valeur qui a franchi la frontière. */
export type Trusted<T> = T & { readonly [sealed]: 'content' };

declare const safeLink: unique symbol;

/** Une URL de navigation dont le protocole est sûr. Jamais une `string` brute. */
export type TrustedUrl = string & { readonly [safeLink]: 'link' };

declare const safeImage: unique symbol;

/** Une URL d'image en https. Jamais une `string` brute. */
export type TrustedImageUrl = string & { readonly [safeImage]: 'image' };

/** Réservé aux analyseurs de sections. Ne jamais exporter depuis `src/index.ts`. */
export function seal<T>(value: T): Trusted<T> {
	return value as Trusted<T>;
}

/**
 * Un texte affichable : non vide, borné. La borne n'est pas cosmétique — un
 * titre de 40 000 caractères casse une mise en page aussi sûrement qu'une
 * injection.
 */
export function text(value: unknown, max = 160): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	if (trimmed.length === 0 || trimmed.length > max) return null;
	return trimmed;
}

/** Un texte long (paragraphe, citation). */
export function prose(value: unknown, max = 1200): string | null {
	return text(value, max);
}

const LINK_PROTOCOLS = new Set(['https:', 'mailto:', 'tel:']);

/**
 * Svelte échappe le texte interpolé, mais pas les URLs : `href={…}` avec un
 * `javascript:` saisi par un gérant s'exécuterait. D'où l'allowlist.
 */
export function link(value: unknown): TrustedUrl | null {
	const raw = text(value, 2000);
	if (raw === null) return null;
	try {
		const parsed = new URL(raw);
		if (!LINK_PROTOCOLS.has(parsed.protocol)) return null;
		return parsed.href as TrustedUrl;
	} catch {
		return null;
	}
}

/** Une image : https uniquement, ce qui exclut aussi les `data:` piégés. */
export function image(value: unknown): TrustedImageUrl | null {
	const raw = text(value, 2000);
	if (raw === null) return null;
	try {
		const parsed = new URL(raw);
		if (parsed.protocol !== 'https:') return null;
		return parsed.href as TrustedImageUrl;
	} catch {
		return null;
	}
}

/** Un entier borné (note d'un avis, etc.). */
export function count(value: unknown, min: number, max: number): number | null {
	if (typeof value !== 'number' || !Number.isInteger(value)) return null;
	if (value < min || value > max) return null;
	return value;
}

/**
 * Une liste : les entrées invalides sont écartées, jamais rendues à moitié, et
 * le total est borné (800 témoignages font une page inutilisable).
 */
export function list<T>(value: unknown, parse: (item: unknown) => T | null, max: number): T[] {
	if (!Array.isArray(value)) return [];
	const kept: T[] = [];
	for (const item of value) {
		if (kept.length === max) break;
		const parsed = parse(item);
		if (parsed !== null) kept.push(parsed);
	}
	return kept;
}

/** Lit une clé sur une valeur de forme inconnue, sans jamais lever. */
export function field(source: unknown, key: string): unknown {
	if (typeof source !== 'object' || source === null) return undefined;
	return (source as Record<string, unknown>)[key];
}
