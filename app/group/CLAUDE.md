# `group` — l'espace des groupements

L'app SvelteKit des GroupMembers (en dev : `http://groupement.localhost:5174`).
Une app simple, sans modules (cf. racine, « Svelte »).

- Les comptes sont ceux des clients : `createCustomerAuthenticationHandle` de
  `shared/auth`, avec `GROUP_URL`. Écrans de connexion et d'inscription :
  ceux de `ui`. **Pas d'inscription libre** : on crée son compte depuis une
  invitation (`/invitation/<jeton>`).
- Les groupements, leurs membres et leurs pharmacies se lisent et s'écrivent
  par `shared/group-db` ; le contrat et ce qu'il coûte, par
  `shared/billing-db`. Un compte qui n'est membre d'aucun groupement n'a accès
  à aucune donnée.
- Sa couleur principale : le module `grp` du design system, posé par
  `data-module` sur le `<body>` de `src/app.html`.
- Ni données de santé, ni données d'une pharmacie qui n'a pas accepté le
  partage.
