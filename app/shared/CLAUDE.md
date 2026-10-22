# Partagé — `app/shared/`

Uniquement du TypeScript **sans interface**, utilisé par au moins deux zones
(un module, `tools/host`, `app/site`…). Un composant Svelte va dans
`tools/ui` ; un code utilisé par une seule zone reste dans cette zone.

Modifiable. Un changement ici touche plusieurs zones : garde la compatibilité
(ajouter plutôt que renommer ou supprimer). Tu ne modifies pas les zones qui
l'utilisent dans la même session : tu lances leur typecheck et tu signales.

`auth`, `pharmacy`, `content-db` et `api-client` sont créés avec leur premier
besoin réel, selon les règles ci-dessous.

## Dépendances entre packages partagés

`auth` et `api-client` ne dépendent d'aucun autre package partagé.
`pharmacy` dépend seulement de `auth` (un Employee peut être relié à un
compte). `content-db` dépend seulement de `packages/schema`.

## `auth` — Better Auth

- La configuration de Better Auth (adaptateur Drizzle) et le schéma `auth`,
  avec ses migrations.
- Les routes de Better Auth (`/api/auth/*`) ne sont servies que par
  `tools/host` ; les écrans de connexion sont dans `tools/modules/home`.
- Le hook SvelteKit commun : vérifie la session, remplit `locals.user`
  (`userId`, `tenantId`, rôles).
- Pour appeler le C# : un JWT court (plugin `jwt`, `tenantId` dans les
  claims), clés publiques exposées en JWKS interne par `tools/host`.
- Pour l'app mobile : un jeton porteur (plugin `bearer`), vérifié par le même
  hook.

## `pharmacy` — le commun : la fiche de la pharmacie et ses employés

- Le schéma `pharmacy` (le Tenant, ses coordonnées, ses Employees) et ses
  migrations.
- Ses fonctions publiques sont **le seul moyen d'écrire** ces tables
  (`addEmployee`, `updatePharmacyContactDetails`…). `home` et `planning` les
  appellent toutes les deux : la règle métier n'existe qu'ici.
- Ses tables sont exportées pour la lecture : une app peut faire une
  jointure dessus, jamais un `insert`, un `update` ni un `delete`.
- Chaque fonction prend le `tenantId` en premier paramètre.

## `api-client` — généré

Produit par `make gen-types`. **Jamais édité à la main** : un type faux se
corrige dans le C#, puis on régénère.

## `content-db` — le schéma `content`

- Le schéma Drizzle `content` et ses migrations (le seul endroit où elles
  vivent).
- Les fonctions de lecture du `TenantSite`, validé par `packages/schema`.
  Les écritures vivent dans `site-manager`.
- Chaque requête passe par la Row-Level Security (cf. racine, « Base de
  données »).
- Les infos de la pharmacie ne sont pas ici : `app/site` les lit dans
  `pharmacy`.
