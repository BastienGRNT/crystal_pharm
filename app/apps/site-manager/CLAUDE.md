# `site-manager` — l'édition du site par le Manager

Servie sur `/site-manager`.

- La seule app qui écrit dans `content` (dans `lib/server/repositories/`).
  Tables et migrations : `shared/content-db`.
- Toute donnée de site est validée par `packages/schema` **avant** d'être
  écrite. Un changement de layout ne perd jamais une donnée déjà saisie.
- Tout texte riche est assaini avant d'être écrit : il sera affiché tel quel
  sur le site public.
- Ce que l'édition doit savoir d'un layout (réglages, zones) se lit par
  l'export sans Solid `@crystal-pharm/layouts/manifest`. S'il manque quelque
  chose, tu t'arrêtes et tu le signales : c'est un travail sur le moteur.
- L'aperçu : une iframe vers `apps/site/__preview`, alimentée par
  `postMessage`.
- Aucune donnée de santé ici.
