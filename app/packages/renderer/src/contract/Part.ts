import type { JSX } from 'solid-js';

declare const partBrand: unique symbol;

/**
 * Un morceau de page que seul le `pageKit` sait fabriquer.
 * Un JSX écrit à la main est un simple `JSX.Element` : il n'est pas assignable à un `Part`.
 */
export type Part<PartName extends string> = JSX.Element & { readonly [partBrand]: PartName };
