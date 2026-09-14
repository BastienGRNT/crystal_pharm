import type { Component } from "svelte";

export interface SiteProps {
	titre: string;
}

export type SiteType = Component<{ data: SiteProps }>;

export interface RenderSiteResult {
	Composant: SiteType;
	props: { data: SiteProps };
}

// ── Vérification d'ÉGALITÉ STRICTE des props (pas juste "compatible") ──────
//
// Sans ça, un composant qui ne déclare AUCUNE prop passe toujours : TS
// considère qu'un composant qui n'attend rien peut être appelé avec
// n'importe quoi (il ignore juste). Ce n'est pas un bug de TS, c'est voulu
// pour les fonctions normales — mais ici on veut l'interdire explicitement.

type Equals<X, Y> =
	(<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;

/** Extrait le type réel des props déclarées par un composant Svelte. */
type PropsOf<C> = C extends Component<infer P, any, any> ? P : never;

/** Si les props de C ne collent pas EXACTEMENT à Expected, le type devient `never`. */
export type ExigeExactement<C, Expected> =
	Equals<PropsOf<C>, Expected> extends true ? C : never;