# CLAUDE.md

Règles du monorepo, valables partout. Chaque zone a son `CLAUDE.md`, lu
automatiquement quand tu y travailles : il précise celui-ci sans le contredire
ni le répéter. Ce fichier reste sous ~300 lignes : au-delà, on en reparle.

Une règle dit comment coder une zone **le jour où on la code**. Elle ne
justifie jamais de créer du code, des fichiers ou de l'outillage en avance.

## Les CLAUDE.md eux-mêmes

- Une règle, un seul endroit : commune → ici ; propre à une zone → le
  `CLAUDE.md` de la zone, qui renvoie ici au lieu de recopier.
- Tu ne modifies un `CLAUDE.md` que si on te le demande. Avant d'écrire, tu
  relis tous les autres et tu signales toute contradiction.

## Vocabulaire — jamais de synonyme dans le code

`Tenant` (une pharmacie cliente, `tenantId`, sa fiche dans `shared/pharmacy-db`) ·
`Employee` (une personne de l'équipe d'un Tenant, avec ou sans compte) ·
`Manager` (connecté à `pharmacy`) · `PharmacyGroup` (un groupement, `groupId`) ·
`GroupMember` (connecté à `group`) · `PlatformAdmin` (nous ou un commercial,
connecté à `admin`) · `Platform` (nous, l'opérateur du SaaS) ·
`Visitor` (la personne sur le site public, sans compte pour l'instant) ·
`TenantSite` (les données d'un site, validées par `engine/schema`) · `Layout`
(un dossier de `engine/layouts`, son nom est l'identifiant) · `Module` (un bloc
activable d'un site).

## La carte

Un dossier d'app porte le nom de **son public** ; un package `shared/*-db`, le
nom du **schéma qu'il possède** ; le reste, le nom de **ce qu'il fait**.

```
├─ CLAUDE.md  README.md  Makefile  compose.yml  .env
├─ docker/                  Caddy : passerelle de dev
└─ app/
   ├─ pharmacy/             l'espace des pharmacies
   │  ├─ host/              SvelteKit : monte les modules, sert l'auth et l'API mobile
   │  └─ modules/           home · site-manager · planning · booking · prescriptions
   ├─ group/                l'espace des groupements (SvelteKit, créé avec son premier besoin)
   ├─ admin/                l'espace Platform (SvelteKit, créé avec son premier besoin)
   ├─ site/                 SolidStart : les sites publics + /__preview
   ├─ api/                  C# : Modules/Booking · Modules/Prescriptions
   ├─ ui/                   le design system Svelte, commun aux trois apps Svelte
   ├─ engine/               LE MOTEUR (Solid) : schema · renderer · layouts
   └─ shared/               TS sans interface, partagé entre apps :
                            auth · pharmacy-db · group-db · content-db · api-client
```

## Qui fait quoi

- **TypeScript** (SvelteKit + Drizzle + Better Auth) : tout ce qui n'est ni
  une donnée de santé ni une règle lourde — comptes et sessions, la fiche de
  la pharmacie et ses employés, les groupements, le planning, le contenu des
  sites.
- **C#** (`app/api`) : seulement `Booking` (concurrence, file d'attente) et
  `Prescriptions`, qui portent les données de santé. Une seule API.
- **`pharmacy`** : les outils d'un Tenant, des modules montés par une seule
  app SvelteKit (`pharmacy/host`) — un déploiement, des frontières de packages.
- **`group`** : un PharmacyGroup voit ses pharmacies membres et les invite.
  **`admin`** : la Platform gère les abonnements, les prix, les groupements et
  leurs quotas. Deux apps SvelteKit simples, sans modules.
- **SolidStart** (`app/site`) : rend les sites. Lit `content` et
  `shared/pharmacy-db` directement, jamais via le C#.
- **L'app mobile du planning** (créée avec son premier besoin) : consomme
  l'API versionnée de `pharmacy/modules/planning`, exposée par `pharmacy/host`.
- Un envoi du Visitor appartient au module qui le traite : un rendez-vous →
  `Booking`, une ordonnance → `Prescriptions`. Un nouveau type d'envoi sans
  module évident : on en parle avant.
- Les emails partent par Resend, derrière une interface (rien en dev).

## Les déployables

| App | Public | En dev |
|---|---|---|
| `pharmacy/host` | les Managers | `http://localhost:5173` |
| `group` | les GroupMembers | `http://groupement.localhost:5174` |
| `admin` | les PlatformAdmins | `http://admin.localhost:5175` |
| `site` | les Visitors | — |
| `api` | `pharmacy`, `site` (jamais Internet) | `5158` |

- Le domaine de chaque app vient de l'environnement (`PHARMACY_URL`,
  `GROUP_URL`, `ADMIN_URL`), jamais du code. Une requête sur un autre domaine
  est renvoyée vers celui-là (le cookie de session n'y vaut pas).
- Une app est sans état : on la fait grossir en lançant plusieurs instances.
  Un module de `pharmacy` ne sort dans sa propre app que pour une raison
  constatée et avec nous (équipe à part, charge mesurée très différente,
  hébergement ou sécurité différents) : le sortir = créer une app qui le monte.
  `group` ou `admin` ne passe en modules que s'il grossit au point qu'un écran
  casse les autres.

## Sécurité — invariants

- Deux identités, jamais mélangées :
  - les **clients** (Manager, GroupMember) : Better Auth de `shared/auth`,
    schéma `auth`, servi par `pharmacy/host` et `group`. Ce qu'un compte peut
    voir vient de ses appartenances (à un Tenant, à un PharmacyGroup), jamais
    du compte seul ;
  - la **Platform** (PlatformAdmin) : son propre Better Auth dans `admin`,
    schéma `platform_auth`, son secret, inscription réservée à une liste
    d'emails. Il réutilise la boîte à outils de `shared/auth`, jamais ses
    comptes clients.
  Pas d'autre système d'auth. Chaque app a son cookie, limité à son domaine.
- Le C# n'est **jamais exposé à Internet**. Il n'accepte que deux appelants
  identifiés : un Manager (JWT court de Better Auth, vérifié par sa clé
  publique) ou le service `site` (identité de service).
- Le `tenantId` vient de la session (ou de son JWT) pour un Manager, de la
  passerelle pour un Visitor (elle écrase tout en-tête tenant venu du
  navigateur). Le `groupId` vient de la session d'un GroupMember. Jamais d'un
  paramètre, d'une URL ou d'un champ de formulaire.
- Chaque processus n'a que ses propres secrets : le C# n'a ni le secret de
  Better Auth ni accès aux schémas `auth` et `platform_auth`.
- Chaque app a son rôle Postgres : écriture sur les schémas qu'elle possède
  ou qu'elle écrit par leurs fonctions, lecture seule sur ce qu'elle lit.

## Données de santé — règle absolue

Ordonnances, rendez-vous et tout ce qui relie une personne à un soin :

- stockés **uniquement** par le C#, dans `booking` et `prescriptions` (et leurs
  fichiers), derrière des interfaces d'`Application` : local en dev, HDS en prod ;
- en prod, seules ces données sont chez l'hébergeur HDS, le reste est sur un
  serveur normal. Donc aucune clé étrangère ni jointure entre un schéma de
  santé et un autre : on se référence par identifiant ;
- côté Node, ils ne font que transiter : jamais en cache, sur disque, dans une
  URL, un log, un message d'erreur ou un outil d'analytics ;
- ni `group` ni `admin` n'en voient jamais : au plus des compteurs agrégés.

## Dépendances autorisées

| Depuis | Peut importer |
|---|---|
| `pharmacy/host` | la partie publique des `pharmacy/modules/*`, `ui`, `shared/auth` |
| un module de `pharmacy` | `ui`, `shared/*`, `engine/schema` |
| `pharmacy/modules/site-manager` | en plus : l'export sans Solid de `layouts` (`/manifest`) |
| `group` | `ui`, `shared/*` |
| `admin` | `ui`, `shared/*` — de `shared/auth`, seulement `/toolkit`, `/tables` et `/client` |
| `app/site` | `engine/*`, `shared/content-db`, `shared/pharmacy-db`, `shared/api-client` |
| `ui` | rien d'autre que Svelte |
| `shared/*` | voir `app/shared/CLAUDE.md` |
| `engine/*` | entre eux seulement : `layouts → renderer → schema` |

- Chaque `package.json` ne déclare que ce que ce tableau autorise : pnpm
  bloque alors le reste.
- Une app n'importe **jamais** une autre app ; un module n'importe jamais un
  autre module, seul `pharmacy/host` importe les modules. Jamais de composant
  Solid dans du Svelte : l'aperçu d'un site passe par une iframe vers
  `app/site/__preview`.

## Svelte (`pharmacy`, `group`, `admin`, `ui`)

Svelte 5 (runes), SvelteKit 2, Tailwind 4, TypeScript strict.

- Atomic design : les composants communs viennent de `ui` ; un composant
  métier reste dans son app (ou son module) ; un composant utilisé par deux
  apps ou deux modules part dans `ui`.
- Couleurs, polices, rayons, espacements : uniquement les tokens de `ui`,
  jamais de valeur en dur.
- Une maquette (cf. « Docs et maquettes ») se traduit en tokens et composants
  de `ui`, jamais en code copié. Un token ou composant absent de `ui` : tu le
  proposes, tu ne l'inventes pas dans l'app ; une maquette qui contredit `ui` :
  tu t'arrêtes et tu le signales.
- Dans `group` et `admin` : `src/routes/` ne fait qu'appeler `src/lib/server/`
  (`services/` pour la logique, `repositories/` seul endroit avec du Drizzle sur
  ses propres tables) ; les composants dans `src/lib/components/`.

## Le moteur (`app/engine/`) se consomme, il ne se modifie pas

Tu le lis et tu l'importes ; tu ne le modifies **que si la demande porte
explicitement sur lui**. Si une tâche ailleurs semble l'exiger : tu t'arrêtes
et tu le signales. Aucun contournement par le shell (`sed`, `>`, script).
Créer ou modifier un layout : lis d'abord `app/engine/docs/creer-un-layout.md`.

## Contrats

- **Données d'un site** : `engine/schema` (Valibot) fait foi. La fiche
  affichée (nom, adresse, téléphone) vient de `shared/pharmacy-db`, jamais
  ressaisie dans `content`.
- **Données TS** : le schéma Drizzle de leur propriétaire fait foi, les types
  en sont déduits. Aucune génération.
- **Données du C#** : son OpenAPI génère `shared/api-client`
  (`make gen-types`), **jamais édité à la main**. Les types régénérés vont
  dans le commit qui change le contrat.
- **La seule frontière TS → C#** : la vue `planning.staff_availability`, lue
  par `Booking`. Changer ses colonnes = changer un contrat : le C# s'adapte
  dans la même branche.
- À la frontière, un **adapter** (une fonction qui traduit un type dans
  l'autre), dans la zone qui en a besoin.

## Versionner les API

- Une API consommée par un client déployé à part (l'app mobile, un client
  externe) est versionnée dans l'URL : `/api/v1/…`. Dans une version, on
  ajoute, on ne retire ni ne renomme jamais. Un changement cassant = `/v2`,
  et la v1 vit tant qu'un client l'utilise.
- Entre les apps du monorepo et le C# (déployés ensemble, mais pas au même
  instant) : pas de version dans l'URL, mais toujours compatible — on ajoute
  d'abord, on retire seulement quand plus personne ne l'utilise.
- Les `load` et actions SvelteKit ne sont pas une API : rien à versionner.

## Base de données

- Un schéma = un seul outil de migration **et un seul propriétaire**. Drizzle :
  `auth` → `shared/auth`, `pharmacy` → `shared/pharmacy-db`, `groups` →
  `shared/group-db`, `content` → `shared/content-db`, `planning` →
  `pharmacy/modules/planning`, `platform_auth` → `admin`. EF Core : `booking`,
  `prescriptions` → le C#.
- Table de suivi Drizzle dans le schéma du propriétaire : drizzle-kit le crée
  avant la 1re migration, où `CREATE SCHEMA` devient `CREATE SCHEMA IF NOT
  EXISTS` (seule retouche permise d'une migration générée).
- Lire les tables d'un autre propriétaire (jointure comprise) : autorisé, par
  ce qu'il exporte. Les écrire : seulement par ses fonctions.
- Isolation entre tenants : Row-Level Security sur tout schéma lié à un
  tenant (ou à un groupement), global query filter EF côté C#. Le tenant se
  pose par transaction (`SET LOCAL`), jamais pour toute la connexion.
- Toute table liée à un tenant a un index qui commence par `tenant_id`.

## Docs et maquettes

- La doc d'une zone vit dans son `docs/`, créé avec sa première doc ; un
  `docs/` racine seulement pour une doc qui concerne plusieurs zones.
- Maquettes : `docs/maquettes/` de la zone (un module, `group`, `admin`, et
  `app/engine/` avec un dossier par layout) ; le design system :
  `app/ui/docs/design-system/`.
- Chaque dossier de maquette a un `README.md` de 3 lignes (ce qu'il montre,
  ce qui est validé, ce qui est brouillon) : tu le lis d'abord, et tu ne
  reproduis jamais une partie brouillon. Une seule version par maquette, jamais
  de zip ; tu ne lis que celle de l'écran en cours.

## Principes de code

- SOLID, KISS, DRY. Clean architecture dès que la zone le permet : les
  dépendances pointent vers le domaine, jamais l'inverse.
- Noms longs et explicites, sans abréviation, pour les fonctions, variables,
  fichiers et dossiers : `calculateNextAvailableAppointmentSlot`, pas `calcSlot`.
- Le code se lit comme une recette : une fonction = une étape nommée, et une
  fonction de haut niveau enchaîne des étapes de même niveau.
- Pas de commentaire sur un code qui s'explique seul : s'il en faut un, c'est
  d'abord un nom à améliorer. Ils sont réservés au code qui ne peut pas être
  clair seul (algorithme, contournement, contrainte externe) et disent
  pourquoi, jamais quoi.
- Rangement : jamais un tas de fichiers à plat. Au-delà de ~8 éléments
  (fichiers + dossiers) à un même niveau, tu regroupes en sous-dossiers par
  fonctionnalité (`components/agenda/`, `services/appointment-booking/`).
  À la racine d'un projet, seulement la configuration : le code va dans
  `src/`. Pas de dossier pour un seul fichier, sauf structure imposée
  (couches, atomic design).
- UI en français, code en anglais. TypeScript strict, jamais de `any`.

## Workflow de session

- Un lot = une session = une branche, dans **une** zone (un module, une app,
  `app/api` ou le moteur), plus `shared/`, `ui` et le branchement dans
  `pharmacy/host` si la tâche l'exige. Jamais un autre module ni une autre app.
- Vérification, une seule fois, à la fin :
  - le typecheck de la zone (`pnpm --filter <package> check` — le script
    s'appelle `check` partout — ou `dotnet build app/api`) ;
  - si tu as touché `shared/` ou le moteur : aussi le typecheck des packages
    qui en dépendent, en lecture seule (tu signales, tu ne corriges pas) ;
  - les tests si tu as touché au domaine ; un test d'intégration pour toute
    règle d'isolation entre tenants, de concurrence ou d'auth ;
  - au plus 2 tentatives de correction, puis tu t'arrêtes et tu signales.
- Jamais de serveur (`make api`, dev), de lint, de formatage, de navigateur
  ni de capture : c'est nous qui les lançons. Erreur signalée à l'exécution :
  tu lances ce qu'il faut pour l'observer (`curl`, logs) plutôt que deviner.

Quand tu t'arrêtes, toujours ce format :
`Arrêt — zone : … · bloqué par : … · proposition : …`

## Commandes

`make start` (Postgres) · `make migrate` (les migrations Drizzle) · `make logs` ·
`make api` · `make gen-types` (créée avec le premier appel d'une app au C#) ·
`pnpm dev` dans `app/` (les trois apps Svelte). Dépendances JS : `pnpm install` dans
`app/`. Rien d'autre tant que le besoin n'est pas réel.

## Git (git flow)

- `main` = la prod, `develop` = l'intégration. Sauf demande explicite, tu ne
  travailles, ne commites et ne merges **jamais** sur `main` ni `develop`.
- Avant de modifier un fichier, tu vérifies la branche : sur `main` ou
  `develop`, tu crées d'abord celle de la tâche depuis `develop` (si le sujet
  n'est pas clair, tu demandes son nom).
- Branche : `<type>/<scope>/<sujet>`, ex. `feat/booking/annulation-par-le-patient`.
  - type : `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf` ;
    `hotfix` seulement depuis `main` ; `release/<version>` est créée par nous ;
  - scope : le dossier de la zone (`host`, `home`, `site-manager`, `planning`,
    `booking`, `prescriptions`, `group`, `admin`, `site`, `api`, `ui`,
    `renderer`, `schema`, `layouts`, `auth`, `pharmacy-db`, `group-db`,
    `content-db`, `api-client`), ou `repo` pour la racine ;
  - sujet : en kebab-case, ce que ça change pour le produit.
- Commit : `<type>(<scope>): <sujet>`, en français, mêmes types et scopes. Le
  corps dit pourquoi, sauf pour un changement trivial.
- **Jamais** de `Co-Authored-By`, de signature ni de trailer d'outil.
- Tu ne commites et ne pushes que si on te le demande.

## Anciens projets

`crystal_pharm-legacy`, `crystal_pharm_proto` : lecture seule, pour une
question précise, jamais copiés tels quels.
