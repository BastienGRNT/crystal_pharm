import type { DesignDeclaration } from './design';
import { field } from './trusted';
import { isSectionName, SECTIONS, type SectionContent, type SectionName } from './sections/registry';

/** Le contenu d'un site, une fois franchie la frontière. */
export type SiteContent = { [N in SectionName]?: SectionContent<N> };

/**
 * La porte d'entrée. Aujourd'hui des mocks, demain l'API C# : même fonction,
 * même `unknown` en entrée. Ce qui ne passe pas n'est pas rendu — la
 * dégradation est par section, jamais par champ, donc jamais une page cassée.
 */
export function parseContent(raw: unknown): SiteContent {
	const content: SiteContent = {};
	for (const name of Object.keys(SECTIONS) as SectionName[]) {
		const parsed = SECTIONS[name](field(raw, name));
		if (parsed !== null) {
			// L'index est sûr par construction : `name` indexe les deux tables.
			(content as Record<SectionName, unknown>)[name] = parsed;
		}
	}
	return content;
}

/**
 * L'ordre effectif des sections.
 *
 * `declared` est l'ordre d'écriture des snippets dans le `Page.svelte` du
 * design : c'est son ordre à lui, et c'est l'ordre par défaut.
 *
 * L'ordre stocké par un site est du contenu saisi comme un autre, et traverse
 * la même frontière : une clé inconnue est écartée, un doublon est écarté
 * (c'est ce qui garantit qu'une section n'apparaît jamais deux fois quand
 * l'ordre ne vient plus du code), une section oubliée retombe à sa place. Un
 * design à ordre fixe ignore purement et simplement ce qui est stocké.
 */
export function resolveOrder(
	declared: readonly SectionName[],
	site: { readonly storedOrder: unknown; readonly reorderable: boolean }
): SectionName[] {
	if (!site.reorderable || !Array.isArray(site.storedOrder)) return [...declared];

	const remaining = new Set<SectionName>(declared);
	const ordered: SectionName[] = [];
	for (const entry of site.storedOrder) {
		if (!isSectionName(entry) || !remaining.has(entry)) continue;
		remaining.delete(entry);
		ordered.push(entry);
	}
	for (const name of declared) {
		if (remaining.has(name)) ordered.push(name);
	}
	return ordered;
}

/**
 * Un design `custom` est réservé. Ce n'est pas un affichage à cacher dans le
 * manager : c'est une autorisation, à vérifier côté serveur avant d'affecter
 * un design à un site.
 */
export function isDesignAllowed(declaration: DesignDeclaration, tenant: string): boolean {
	return declaration.tenants === null || declaration.tenants.includes(tenant);
}
