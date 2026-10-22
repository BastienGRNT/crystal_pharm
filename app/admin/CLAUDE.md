# `admin` — l'espace Platform

L'app SvelteKit des PlatformAdmins (en dev : `http://admin.localhost:5175`).
Une app simple, sans modules (cf. racine, « Svelte »).

- Sa propre identité, jamais celle des clients : le schéma `platform_auth`
  (propriétaire : `admin`, migrations dans
  `src/lib/server/authentication/migrations/`), le secret
  `PLATFORM_AUTH_SECRET`, son cookie. De `shared/auth`, elle n'importe que la
  boîte à outils (`/toolkit`, `/tables`) et le client navigateur (`/client`),
  jamais l'entrée des comptes clients.
- Inscription réservée aux emails de `PLATFORM_ADMIN_EMAILS` ; sessions de
  8 heures.
- Les abonnements, les prix, les groupements et leurs quotas s'écrivent par
  les fonctions de leur propriétaire (`shared/group-db`…), jamais par une
  requête Drizzle propre à `admin`.
- Sa couleur principale : le module `accueil` (ardoise) du design system,
  posé par `data-module` sur le `<body>` de `src/app.html`.
