import type { Component } from 'svelte';
import type { AnyLayoutMeta, LayoutProps } from './define-layout';

// Le point de passage obligé : un layout n'existe pour le reste du monde
// que s'il passe ici. La fonction confronte ce que le layout déclare
// (son meta) à ce que son composant accepte vraiment comme props.
export interface RegisteredLayout<Meta extends AnyLayoutMeta> {
	meta: Meta;
	Component: Component<LayoutProps<Meta>>;
}

export function registerLayout<Meta extends AnyLayoutMeta>(
	meta: Meta,
	Component: Component<LayoutProps<Meta>>
): RegisteredLayout<Meta> {
	return { meta, Component };
}
