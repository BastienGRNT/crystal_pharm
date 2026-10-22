# `group` — l'espace des groupements

L'app SvelteKit des GroupMembers (en dev : `http://groupement.localhost:5174`).
Une app simple, sans modules (cf. racine, « Svelte »).

- Les comptes sont ceux des clients : `createCustomerAuthenticationHandle` de
  `shared/auth`, avec `GROUP_URL`. Écrans de connexion et d'inscription :
  ceux de `ui`.
- Les groupements, leurs membres et leurs pharmacies se lisent et s'écrivent
  par `shared/group-db` (créé avec son premier besoin). Tant qu'il n'existe
  pas, un compte connecté n'a accès à aucune donnée.
- Sa couleur principale : le module `grp` du design system, posé par
  `data-module` sur le `<body>` de `src/app.html`.
- Ni données de santé, ni données d'une pharmacie qui n'a pas accepté le
  partage.
