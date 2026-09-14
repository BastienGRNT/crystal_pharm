import { Plugin } from 'vite';

interface SvelteCheckGuardOptions {
    /** Chemin du tsconfig à passer à svelte-check (relatif au projet qui utilise le plugin) */
    tsconfigPath?: string;
    /** Si true (défaut), bloque aussi le serveur dev avec un overlay tant qu'il y a une erreur */
    failOnDev?: boolean;
}
/**
 * Plugin Vite réutilisable : fait de `svelte-check` un vrai gate de compilation
 * pour n'importe quel projet Svelte qui l'installe.
 *
 * - `vite build` échoue (exit code != 0) s'il y a la moindre erreur de type.
 * - `vite dev` pousse l'erreur dans l'overlay natif de Vite, tant que le code
 *   contient une erreur de type (si `failOnDev` est activé).
 */
declare function svelteCheckGuard(options?: SvelteCheckGuardOptions): Plugin;

export { type SvelteCheckGuardOptions, svelteCheckGuard };
