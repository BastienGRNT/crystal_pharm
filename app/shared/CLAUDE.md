# Partagé — `app/shared/`

Uniquement du TypeScript **sans interface**, utilisé par au moins deux zones
(un module, une app). Un composant Svelte va dans `ui` ; un code utilisé par
une seule zone reste dans cette zone. Un package `*-db` porte le nom du
schéma qu'il possède.

Modifiable. Un changement ici touche plusieurs zones : garde la compatibilité
(ajouter plutôt que renommer ou supprimer). Tu ne modifies pas les zones qui
l'utilisent dans la même session : tu lances leur typecheck et tu signales.

`pharmacy-db`, `group-db`, `content-db` et `api-client` sont créés avec leur
premier besoin réel, selon les règles ci-dessous.

## Dépendances entre packages partagés

`auth` et `api-client` ne dépendent d'aucun autre package partagé.
`pharmacy-db` dépend seulement de `auth` (un compte appartient à des
Tenants). `group-db` dépend de `auth` et de `pharmacy-db`. `content-db`
dépend seulement de `engine/schema`.

## `auth` — les comptes clients (Better Auth)

- Les comptes des Managers et des GroupMembers : la configuration de Better
  Auth (adaptateur Drizzle) et le schéma `auth`, avec ses migrations
  (`src/customer/`). Celle de la Platform n'est pas ici : elle vit dans
  `admin`, construite avec la même boîte à outils (`src/toolkit/`).
- Quatre entrées :
  - `.` : les comptes clients côté serveur (`createCustomerAuthenticationHandle`) ;
  - `./toolkit` : ce qui sert à toute identité (le hook, la connexion à la
    base, `summarizeSignedInUser`) ;
  - `./tables` : les tables de Better Auth, posées dans le schéma voulu (sans
    dépendance à SvelteKit, pour drizzle-kit) ;
  - `./client` : le navigateur (`signInAndOpen`, `registerAndOpen`,
    `signOutAndOpen`, et les messages d'échec en français).
- Un compte a un `firstName`, un `lastName` et un `name` (les deux réunis,
  exigé par Better Auth) : `personNameFields`, commun aux deux identités.
- Les routes de Better Auth (`/api/auth/*`) sont servies par `pharmacy/host`
  et `group`, chacune sur son domaine ; les écrans de connexion sont dans
  `pharmacy/modules/home` et dans `group`.
- Les hooks SvelteKit communs : vérifier la session et remplir `locals.user`,
  rediriger selon la connexion. `auth` ne connaît ni Tenant ni groupement :
  le Tenant actif et les rôles viennent des appartenances, ajoutés par
  `pharmacy-db` (ou `group-db`).
- Pour appeler le C# : un JWT court (plugin `jwt`, `tenantId` dans les
  claims), clés publiques exposées en JWKS interne par `pharmacy/host`.
- Pour l'app mobile : un jeton porteur (plugin `bearer`), vérifié par le même
  hook.

## `pharmacy-db` — la fiche de la pharmacie et ses employés

- Le schéma `pharmacy` (le Tenant, ses coordonnées, ses Employees, les
  appartenances des comptes) et ses migrations.
- Un compte peut appartenir à plusieurs Tenants (un titulaire de plusieurs
  officines) : la session porte le Tenant actif, qu'un sélecteur change.
- Ses fonctions publiques sont **le seul moyen d'écrire** ces tables
  (`addEmployee`, `updatePharmacyContactDetails`…). `home` et `planning` les
  appellent toutes les deux : la règle métier n'existe qu'ici.
- Ses tables sont exportées pour la lecture : une app peut faire une
  jointure dessus, jamais un `insert`, un `update` ni un `delete`.
- Chaque fonction prend le `tenantId` en premier paramètre.

## `group-db` — les groupements

- Le schéma `groups` : les PharmacyGroups et leur quota de pharmacies, leurs
  GroupMembers, l'appartenance des pharmacies, les invitations.
- Une pharmacie appartient à un groupement au plus à la fois. L'appartenance
  garde son historique (`joined_at`, `left_at`), jamais supprimée.
- Ses fonctions sont le seul moyen d'écrire. Le quota s'y vérifie : pharmacies
  membres + invitations en attente ≤ quota.
- Une invitation est nominative (un email), à usage unique, expire, et se
  révoque. La pharmacie accepte explicitement que le groupement voie ses
  données ; chacun des deux peut y mettre fin.
- Lu par `group` (seulement ses pharmacies, RLS sur le `groupId`), `admin`
  et `pharmacy` (savoir à quel groupement on appartient).

## `api-client` — généré

Produit par `make gen-types`. **Jamais édité à la main** : un type faux se
corrige dans le C#, puis on régénère.

## `content-db` — le schéma `content`

- Le schéma Drizzle `content` et ses migrations (le seul endroit où elles
  vivent).
- Les fonctions de lecture du `TenantSite`, validé par `engine/schema`.
  Les écritures vivent dans `site-manager`.
- Chaque requête passe par la Row-Level Security (cf. racine, « Base de
  données »).
- Les infos de la pharmacie ne sont pas ici : `app/site` les lit dans
  `pharmacy-db`.
