# `site` — les sites publics (SolidStart)

Sert les sites de tous les tenants, et l'aperçu de `site-manager`. L'app
elle-même est créée à l'étape 2 de `app/packages/docs/prochaines-etapes.md`.

## Rendu

- Il reçoit un `tenantId` de la passerelle et ne voit **jamais** un nom de
  domaine.
- Il lit le site dans `content` via `shared/content-db`, avec un cache dont
  la clé contient **toujours** le `tenantId`.
- Il ne rend rien lui-même : il appelle `createTenantSitePage` du moteur et
  affiche la page obtenue. Une seule route attrape-tout.
- Il n'écrit jamais dans `content`.

## L'aperçu (`/__preview`)

- Les données en cours d'édition arrivent de `site-manager` par
  `postMessage` : origine vérifiée, contenu validé par `packages/schema`,
  tout le reste refusé.
- En aperçu, le moteur reçoit des adapters **sans effet** : rien ne part
  jamais vers le C#.
- `frame-ancestors` limité au domaine des outils ; `/__preview` n'est jamais
  servi sur le domaine d'un tenant.

## Envois du Visitor (by design, dès le premier formulaire)

- Les fonctions d'envoi données au moteur (`submitPrescription`…) sont des
  adapters : formulaire validé → appel au C#, côté serveur, avec l'identité de
  service `site` et le `tenantId` de la passerelle.
- Le fichier passe en flux vers le C#, sans jamais toucher le disque (pas de
  fichier temporaire du parseur multipart).
- Une clé d'idempotence par envoi (un double clic ne crée pas deux envois),
  un champ piège anti-robot et une limite de débit par IP.
- Rien de ce que le Visitor envoie n'est gardé ici.
