# `site` — les sites publics (SolidStart)

Sert les sites de tous les tenants, et l'aperçu de `site-manager`. L'app
elle-même est créée à l'étape 2 de `app/engine/docs/prochaines-etapes.md`.

## Rendu

- Il reçoit un `tenantId` de la passerelle et ne voit **jamais** un nom de
  domaine.
- Il lit le site dans `content` via `shared/content-db`, la fiche de la
  pharmacie (nom, adresse, téléphone) dans `shared/pharmacy-db`, et son
  groupement (fiche, modules imposés, actualités) dans `shared/group-db`. Un
  adapter les assemble en `TenantSite`, selon les règles du site affiché de
  `shared/content-db` (les mêmes que l'aperçu).
- Il ne rend rien lui-même : il appelle `createTenantSitePage` du moteur et
  affiche la page obtenue. Une seule route attrape-tout pour les pages ; à
  côté, seulement des routes techniques préfixées `__` : `__media/*` (les
  images) et `__preview` (dont ses images, `__preview/media/*`).
- Le cache est celui de la passerelle : sa clé contient **toujours** le
  `tenantId` et la version du site (l'empreinte de ce qu'il affiche), posés
  par la passerelle. Seule une page `GET` réussie d'un Tenant se garde
  (`public, s-maxage=60`) ; tout le reste est `no-store`, et rien de ce
  qu'envoie un Visitor n'y entre jamais.
- Il n'écrit jamais dans `content`.

## L'aperçu (`/__preview`)

- Les données en cours d'édition arrivent de `site-manager` par
  `postMessage` : origine vérifiée, contenu validé par `engine/schema`,
  tout le reste refusé.
- En aperçu, le moteur reçoit des adapters **sans effet** : rien ne part
  jamais vers le C#.
- `frame-ancestors` limité au domaine des outils ; `/__preview` n'est jamais
  servi sur le domaine d'un tenant.
- Ses images passent par `/__preview/media/<jeton>` : un jeton signé et
  daté par `site-manager` (cf. `shared/content-db`), jamais un identifiant
  brut.

## Envois du Visitor (by design, dès le premier formulaire)

- Les fonctions d'envoi données au moteur (`submitPrescription`…) sont des
  adapters : formulaire validé → appel au C#, côté serveur, avec l'identité de
  service `site` et le `tenantId` de la passerelle.
- Le fichier passe en flux vers le C#, sans jamais toucher le disque (pas de
  fichier temporaire du parseur multipart).
- Une clé d'idempotence par envoi (un double clic ne crée pas deux envois),
  un champ piège anti-robot et une limite de débit par IP.
- Rien de ce que le Visitor envoie n'est gardé ici.
