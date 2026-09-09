import type { Component } from 'svelte';
import type { Assurance } from './assurances';
import Complete from './render/Complete.svelte';
import Custom from './render/Custom.svelte';
import Signature from './render/Signature.svelte';
import type { DesignSnippets } from './render/snippets';

/**
 * Ce qu'un design déclare : son nom (celui que lit le pharmacien) et s'il
 * accepte d'être réordonné. Rien d'autre — ni id, ni sections, ni ordre.
 *
 * `Host` est l'hôte de sa gamme. Le design l'utilise dans son `Page.svelte`,
 * donc la gamme est écrite une seule fois, ici, et c'est elle qui décide de ce
 * que le compilateur exigera de la page.
 */
export type DesignDeclaration<A extends Assurance = Assurance> = {
	readonly assurance: A;
	readonly name: string;
	/**
	 * Un design à ordre fixe autorise ses sections à supposer leur position.
	 * Un design réordonnable ne peut rien supposer : c'est une propriété de son
	 * HTML, que seul son auteur connaît.
	 */
	readonly reorderable: boolean;
	/** Tenants autorisés. Obligatoire pour un sur-mesure, absent partout ailleurs. */
	readonly tenants: readonly string[] | null;
	readonly Host: Component<DesignSnippets<A>>;
};

export function complete(design: { name: string; reorderable: boolean }): DesignDeclaration<'complete'> {
	return { assurance: 'complete', tenants: null, Host: Complete, ...design };
}

export function signature(design: { name: string; reorderable: boolean }): DesignDeclaration<'signature'> {
	return { assurance: 'signature', tenants: null, Host: Signature, ...design };
}

/** `tenants` n'est pas optionnel : un sur-mesure sans destinataire n'existe pas. */
export function custom(design: {
	name: string;
	reorderable: boolean;
	tenants: readonly [string, ...string[]];
}): DesignDeclaration<'custom'> {
	return { assurance: 'custom', Host: Custom, ...design };
}
