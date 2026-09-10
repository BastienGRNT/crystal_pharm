# CLAUDE.md

Ce fichier est la seule source de vérité sur l'architecture et le workflow.
Il reste volontairement court. S'il dépasse ~150 lignes, on en reparle avant
d'en ajouter — on éclate en fichiers séparés à ce moment-là, pas avant.

## Stack et frontière de responsabilité

- **C# (.NET)** : tenant, authentification (Identity + cookie + JWT émis au
  login), et plus tard le paiement ou toute règle métier vraiment critique.
  Développé par lots larges — pas de micro-découpage, la maîtrise C# est
  acquise.
  - API en **Controllers** (jamais Minimal API — lisibilité prioritaire).
  - **DDD lite**, 4 projets : `Domain` (entités, aucune dépendance externe),
    `Application` (services, interfaces, DTOs), `Infrastructure` (EF Core,
    Identity, implémentations), `Api` (Controllers, Program.cs, DI).
  - Sous-dossiers **fixés dès le départ**, même vides : `Domain/{Entities,
    ValueObjects}` ; `Application/{Dtos,Interfaces,Services}` ;
    `Infrastructure/{Persistence,Persistence/Configurations,Repositories,
    Services}` ; `Api/Controllers`. C'est de la plomberie de namespaces, pas
    de l'anticipation métier : le coût de correction grandit avec le temps
    (tout import à reprendre), donc acté dès le premier fichier.
  - Le mapping EF Core de chaque entité vit dans sa propre classe
    `IEntityTypeConfiguration<T>` sous `Persistence/Configurations`, appliquée
    via `ApplyConfigurationsFromAssembly` — jamais empilé dans
    `OnModelCreating`, illisible dès la 3e entité.
  - Secrets et connection strings : jamais dans `appsettings*.json`, toujours
    via le `.env` racine (déjà utilisé par Docker), lu au démarrage
    (`DotNetEnv`) puis exposé en variables standard
    (`ConnectionStrings__Default`, `Jwt__Secret`…). Un seul `.env` pour tout
    le repo : la CI s'appuie sur les mêmes variables, pas sur des fichiers par
    environnement.
- **SvelteKit + Drizzle** : tout le reste (sites, contenu, rendu public,
  formulaires manager). Développé **brique par brique**, chaque brique
  testable seule avant la suivante.
- Une seule base Postgres, deux schémas : `identity` (Tenant, Identity, futur
  Plan/facturation) migré **uniquement** par EF Core, `content` (Site,
  contenu des sections…) migré **uniquement** par Drizzle. Règle absolue :
  un schéma = un seul outil de migration, jamais les deux.
- Isolation multi-tenant sur `content.*` : Row-Level Security Postgres, jamais
  une simple clause `WHERE` côté code. Le rôle applicatif Drizzle n'est jamais
  propriétaire des tables.
- Le pont entre les deux mondes : un JWT émis par le C# au login, vérifié côté
  SvelteKit dans `hooks.server.ts`, sans appel réseau vers l'API C#.

## Topologie des apps (important : ne pas recopier l'ancien repo)

- Tout le code vit sous `app/` (`app/api`, `app/site-web` et
  `app/manager-web` plus tard), pour garder la racine lisible face aux
  fichiers d'infra (`compose.yml`, `Makefile`, `.env`). `app/` est une
  exception actée à la règle anti-anticipation : dossier de plomberie sans
  contenu métier. Ce qu'il contient y reste soumis — chaque sous-dossier n'est
  créé que lorsque son besoin est réel.
- Autre exception : `app/packages/designs` est développé **avant** `site-web`
  et `manager-web`, car c'est le cœur partagé par les deux. Il se vérifie en
  vase clos, sur mocks, sans tenant, sans base, sans API. `site-web` naîtra
  avec **zéro** code de design dedans (pages plomberie du type
  `<p>{tenant.nom}</p>`) ; le branchement au vrai rendu est une brique
  séparée, une fois les deux validés chacun de leur côté.
- `app/manager-web` est un projet **séparé**, créé quand le premier formulaire
  manager en a besoin : le site public doit rester ~0 KB de JS, le manager a
  besoin de formulaires riches.
- `app/platform-web` (admin/back-office) : **ne pas créer** tant qu'il n'y a
  pas de vrai besoin de gérer plusieurs tenants au quotidien. La création de
  tenant se teste au `curl` en attendant.

## Le système de designs (`app/packages/designs`)

Un **design** est ce que le pharmacien choisit ; une **section** est un bloc de
sa page ; une **assurance** est la promesse que porte le design (`complete`,
`signature`, `custom`). Trois invariants, le reste est dans
`app/packages/designs/README.md`, à lire avant de toucher au package :

- **L'assurance décide de la quantité de vérification**, et rien d'autre ne
  bride un design. C'est ce qui permet des designs originaux sans décevoir un
  pharmacien : l'étiquette dit la vérité, vérifiée par le seul `svelte-check`.
- **Rien n'est généré.** Aucune commande n'est nécessaire pour que le code
  fonctionne : pas de générateur, pas de lint maison, pas de rendu de
  vérification.
- **Tout contenu entre en `unknown`** et ne ressort que scellé par
  `sections/registry.ts`, seul fichier du dépôt capable de sceller.

## Commandes

- `make start` : lance ce qui tourne en continu sans qu'on y touche — pour
  l'instant, Postgres (Docker).
- `make api` : lance l'API .NET en rechargement à chaud (`dotnet watch run`).
- `make dev-design` : lance la preview des designs (Vite). Ne dépend ni de la
  base ni de l'API : rendu sur mocks.
- `make check-design` : surveille en continu les erreurs de type
  (`svelte-check --watch`), à laisser tourner pendant qu'on écrit un design.
- `make logs` : suit les logs de ce que `make start` a lancé.
- `make api`, `make dev-design` et `make check-design` tournent **toujours en
  foreground, dans leur propre terminal** — jamais en arrière-plan, jamais
  détachés. Ctrl+C les tue normalement : `make` exécute la commande, il ne la
  détache pas.
- Rien d'autre tant que le besoin n'est pas réel. Ne pas ajouter de commande,
  de script ou d'outil de manière spéculative.

## Workflow de session

- Un lot = une session = une branche = un commit. Jamais deux sujets mélangés
  dans la même session, même s'ils semblent liés.
- Une brique Svelte n'est valable que si : (1) elle touche peu de fichiers,
  (2) elle se vérifie par un geste concret en moins de 2 minutes (curl, test,
  page affichée), (3) je peux la réexpliquer avec mes mots juste après. Si un
  des trois manque, on redécoupe avant de continuer.
- Ne jamais anticiper un besoin qui n'existe pas encore (pas de règle, pas
  d'abstraction, pas de fichier de spec avant qu'un cas réel ne l'exige).
- Commits : jamais de "Co-Authored-By", jamais de trailer ou de signature
  générée par l'outil. Message de commit uniquement, comme si je l'avais écrit.

## NOTES.md

- Journal de décisions, pas un cahier des charges. Une entrée seulement quand
  une décision est prise et validée, pas avant.
- Format par entrée : quoi / pourquoi / comment c'est vérifié / commit lié.
- Ne pas relire tout `NOTES.md` à chaque session : seulement la dernière
  entrée pertinente au sujet du jour, pour économiser du contexte.

## Ancien projet (`crystal_pharm-legacy`)

Lecture seule, jamais importé tel quel. Consulté à la demande, seulement pour
une question précise (ex. une règle a11y déjà tranchée) — jamais lu en entier.
