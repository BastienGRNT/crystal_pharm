# `host` — l'app qui monte les modules

Le seul déployable des outils. Il ne contient **aucune logique métier** : il
branche les modules de `tools/modules/`.

- `src/routes/<module>/` : un dossier par module (`/` pour `home`). Un
  fichier de route ne fait qu'importer une page du module et ré-exporter son
  `load` ou ses actions depuis `@crystal-pharm/<module>/server`. Une
  condition, une requête ou une règle dans une route : ça va dans le module.
- `hooks.server.ts` : le hook de `shared/auth` (session → `locals.user`) et
  `Cache-Control: no-store` sur `/booking` et `/prescriptions`.
- Il sert Better Auth (`/api/auth/*`) et le JWKS interne lu par le C#.
- Le cadre : `+layout.svelte`, avec `AppShell` et `toolLinks` de `tools/ui`.
- L'API pour un client déployé à part : `src/routes/api/v1/<module>/`
  (`+server.ts`), qui ré-exporte les handlers du module.
- Sans état : on le fait grossir en lançant plusieurs instances.
- Ajouter un module : son package dans `tools/modules/`, sa dépendance dans
  `package.json`, son dossier dans `src/routes/`, son entrée dans `toolLinks`.
