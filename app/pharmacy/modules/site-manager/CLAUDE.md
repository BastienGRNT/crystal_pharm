# `site-manager` — l'édition du site par un TenantMember

Monté sur `/site-manager` par `pharmacy/host`.

- Le seul module qui écrit dans `content` (dans `src/server/repositories/`).
  Tables et migrations : `shared/content-db`.
- Toute donnée de site est validée par `engine/schema` **avant** d'être
  écrite. Un changement de layout ne perd jamais une donnée déjà saisie.
- Tout texte riche est assaini avant d'être écrit : il sera affiché tel quel
  sur le site public.
- Ce que l'édition doit savoir d'un layout (réglages, zones) se lit par
  l'export sans Solid `@crystal-pharm/layouts/manifest`. S'il manque quelque
  chose, tu t'arrêtes et tu le signales : c'est un travail sur le moteur.
- L'aperçu : une iframe vers `app/site/__preview`, alimentée par
  `postMessage`.
- La fiche de la pharmacie (nom, adresse, téléphone) ne se saisit pas ici :
  elle vient de `shared/pharmacy-db` et s'édite dans `home`.
- Aucune donnée de santé ici.
