import type { Component } from 'svelte';
import type { DesignDeclaration } from '../design';

export type Design = {
	readonly id: string;
	readonly declaration: DesignDeclaration;
	readonly Page: Component<Record<string, never>>;
};

/**
 * Les designs disponibles : un dossier = un design. Rien à enregistrer, rien à
 * générer — déposer un dossier suffit, l'enlever suffit.
 *
 * Ces globs ne portent aucune garantie : ils ne servent qu'à lister. Tout ce
 * qui est promis est vérifié par le compilateur dans le `Page.svelte` de
 * chaque design, face à l'hôte de sa gamme.
 */
const declarations = import.meta.glob<{ default: DesignDeclaration }>('./*/design.ts', {
	eager: true
});
const pages = import.meta.glob<{ default: Component<Record<string, never>> }>('./*/Page.svelte', {
	eager: true
});

const idOf = (path: string) => path.split('/')[1];

export const DESIGNS: Design[] = Object.entries(declarations)
	.map(([path, module]) => {
		const id = idOf(path);
		const page = pages[`./${id}/Page.svelte`];
		if (!page) throw new Error(`Le design "${id}" n'a pas de Page.svelte.`);
		return { id, declaration: module.default, Page: page.default };
	})
	.sort((a, b) => a.id.localeCompare(b.id));

export function designById(id: string): Design | undefined {
	return DESIGNS.find((design) => design.id === id);
}
