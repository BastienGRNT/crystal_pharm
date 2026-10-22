# Les outils — `app/tools/`

Tout le Svelte des outils : Svelte 5 (runes), SvelteKit 2, Tailwind 4,
TypeScript strict.

- `host/` : la seule app SvelteKit, qui monte les modules ;
- `ui/` : le design system ;
- `modules/` : un outil par module.

Chacun a son `CLAUDE.md`. Qui peut importer quoi : cf. racine, « Dépendances
autorisées ».

## Front (pour `ui` et les modules)

- Atomic design : les composants communs viennent de `tools/ui` ; un
  composant métier reste dans son module ; un composant utilisé par deux
  modules part dans `tools/ui`.
- Couleurs, polices, rayons, espacements : uniquement les tokens de
  `tools/ui`, jamais de valeur en dur.
- Une maquette (cf. racine, « Docs et maquettes ») est une référence visuelle,
  pas du code à copier : elle se traduit en tokens et en composants de
  `tools/ui`, jamais en styles en dur.
- Une couleur, une taille ou un composant de la maquette absent de
  `tools/ui` : tu proposes le token ou le composant, tu ne l'inventes pas
  dans le module. Une maquette en contradiction avec `tools/ui` : tu
  t'arrêtes et tu le signales.
