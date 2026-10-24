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
- L'adresse du site (`<adresse>.` + le domaine de `SITE_URL`) : proposée depuis le nom
  de la pharmacie au premier enregistrement, changée sur `/adresse`. Une
  ancienne adresse redirige (301) vers l'actuelle.
- L'accès de la passerelle (`/internal/site-access`, jeton
  `SITE_GATEWAY_TOKEN`) : trouve le Tenant d'une adresse, vérifie son
  abonnement au Tool `site` et donne la version du site (l'empreinte de tout
  ce qu'il affiche), clé du cache avec le `tenantId`.
- La fiche de la pharmacie (nom, adresse, téléphone) ne se saisit pas ici :
  elle vient de `shared/pharmacy-db` et s'édite dans `home`.
- Aucune donnée de santé ici.
