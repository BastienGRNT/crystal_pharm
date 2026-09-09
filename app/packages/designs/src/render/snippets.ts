import type { Snippet } from 'svelte';
import type { Assurance, PromisedBy } from '../assurances';
import type { SectionContent, SectionName } from '../sections/registry';

/**
 * Un snippet de section reçoit son contenu **déjà scellé**, en paramètre. Un
 * design ne peut donc pas obtenir de donnée brute : il n'y a pas d'accesseur,
 * pas de contexte à interroger, rien à importer. Le seul contenu qui lui
 * parvient est celui que l'hôte lui passe.
 *
 * Il n'est appelé que si la section est remplie : le design n'écrit jamais de
 * garde d'absence, et une section non activée n'est jamais affichée.
 */
export type SectionSnippet<N extends SectionName> = Snippet<[SectionContent<N>]>;

/** Ce que la gamme impose. C'est ici que le compilateur nomme la section oubliée. */
export type Promised<A extends Assurance> = {
	[N in PromisedBy<A>]: SectionSnippet<N>;
};

/** Ce qu'un design peut ajouter librement, quelle que soit sa gamme. */
export type Optional = {
	[N in SectionName]?: SectionSnippet<N>;
};

/**
 * Les props d'un hôte de gamme. Une section écrite deux fois est un doublon de
 * propriété, refusé par le compilateur ; une section inventée est une propriété
 * inconnue, refusée aussi.
 */
export type DesignSnippets<A extends Assurance> = Promised<A> & Optional;
