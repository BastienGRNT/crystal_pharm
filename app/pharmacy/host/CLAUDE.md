# `host` — l'app qui monte les modules

Le déployable de l'espace `pharmacy`. Il ne contient **aucune logique
métier** : il branche les modules de `pharmacy/modules/`.

- `src/routes/(tools)/<module>/` : un dossier par module (`/` pour `home`),
  dans le cadre `AppShell`. `src/routes/(authentication)/` : les écrans de
  `home` sans menu (connexion, inscription).
- Un fichier de route ne fait qu'importer une page du module et ré-exporter
  son `load` ou ses actions depuis `@crystal-pharm/<module>/server`. Une
  condition, une requête ou une règle dans une route : ça va dans le module.
- `hooks.server.ts` : `createCustomerAuthenticationHandle` de `shared/auth`
  (avec `PHARMACY_URL`) et `Cache-Control: no-store` sur `/booking` et
  `/prescriptions`.
- Il sert Better Auth (`/api/auth/*`) et le JWKS interne lu par le C#.
- Le menu : `src/lib/toolLinks.ts`, passé à `AppShell` de `ui`
  avec la personne connectée (le `load` du cadre vient de `home`).
- L'API pour un client déployé à part : `src/routes/api/v1/<module>/`
  (`+server.ts`), qui ré-exporte les handlers du module.
- Ajouter un module : son package dans `pharmacy/modules/`, sa dépendance dans
  `package.json`, son dossier dans `src/routes/(tools)/`, son entrée dans
  `toolLinks` (icône et couleur de module de `ui`).
