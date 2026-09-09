import { getContext, setContext } from 'svelte';
import type { SiteContent } from '../site';
import type { SectionName } from '../sections/registry';

const SITE = Symbol('crystal-pharm.site');

export type SiteScope = {
	/** Le contenu scellé du site. */
	readonly content: SiteContent;
	/** L'ordre stocké par le site, tel quel : validé au moment de s'en servir. */
	readonly storedOrder: unknown;
	readonly reorderable: boolean;
	/**
	 * Appelé par l'hôte avec les sections que le design déclare réellement.
	 * C'est ce qui permet à la preview d'afficher la liste — sans étape de
	 * génération, sans que le design ait à la redire.
	 */
	readonly declare: (sections: readonly SectionName[]) => void;
};

/** Posé par `SiteRenderer`, lu par l'hôte de gamme. Un design ne voit ni l'un ni l'autre. */
export function provideSite(scope: () => SiteScope): void {
	setContext(SITE, scope);
}

export function useSite(): SiteScope {
	const scope = getContext<(() => SiteScope) | undefined>(SITE);
	if (!scope) throw new Error('Un design ne peut être rendu que par SiteRenderer.');
	return scope();
}
