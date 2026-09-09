# CLAUDE.md

Ce fichier est la seule source de vérité sur l'architecture et le workflow.
Il reste volontairement court. S'il dépasse ~150 lignes, on en reparle avant
d'en ajouter — on éclate en fichiers séparés à ce moment-là, pas avant.

## Stack et frontière de responsabilité

- **C# (.NET)** : tenant, authentification (Identity + cookie + JWT émis au
  login), et plus tard tout ce qui touche au paiement ou à une règle métier
  vraiment critique. Développé et validé par lots larges — pas de
  micro-découpage ici, la maîtrise C# est déjà acquise.
  - API en **Controllers** (jamais Minimal API — lisibilité prioritaire).
  - Architecture **DDD lite** : 4 projets, `Domain` (entités, aucune
    dépendance externe), `Application` (services, interfaces, DTOs),
    `Infrastructure` (EF Core, Identity, implémentations), `Api`
    (Controllers, Program.cs, DI).
  - Convention de sous-dossiers **fixée dès le départ**, dans chaque
    projet, même vide au début : `Domain/Entities`, `Domain/ValueObjects` ;
    `Application/Dtos`, `Application/Interfaces`, `Application/Services` ;
    `Infrastructure/Persistence`, `Infrastructure/Persistence/Configurations`,
    `Infrastructure/Repositories`, `Infrastructure/Services` ;
    `Api/Controllers`. Ce n'est pas de
    l'anticipation métier (la règle anti-anticipation plus bas ne
    s'applique pas ici) — c'est une convention de plomberie/namespaces
    dont le coût de correction grandit avec le temps (tout import à
    reprendre), donc actée une bonne fois, dès le premier fichier.
  - Le mapping EF Core de chaque entité vit dans sa propre classe
    `IEntityTypeConfiguration<T>` sous `Infrastructure/Persistence/Configurations`,
    appliquées via `ApplyConfigurationsFromAssembly` — jamais empilées dans
    `OnModelCreating`, qui reste illisible dès la 2e ou 3e entité. Base du
    DDD, pas une règle à part.
  - Secrets et connection strings : jamais dans `appsettings*.json`, toujours
    via le `.env` racine (déjà utilisé par Docker), lu par l'Api au démarrage
    (`DotNetEnv`) puis exposé via les variables d'environnement standard
    (`ConnectionStrings__Default`, `Jwt__Secret`, ...). Un seul `.env` pour
    tout le repo, pas un par outil — pipelines/CI s'appuient sur les mêmes
    variables d'environnement, pas sur des fichiers de config par environnement.
- **SvelteKit + Drizzle** : tout le reste (sites, modules de contenu,
  rendu public, formulaires manager). Développé **brique par brique**, chaque
  brique testable seule avant la suivante.
- Une seule base Postgres, deux schémas :
  - `identity` (Tenant, Identity, futur Plan/facturation) → migré
    **uniquement** par EF Core.
  - `content` (Site, SiteModule...) → migré **uniquement** par Drizzle.
  - Règle absolue : un schéma = un seul outil de migration, jamais les deux.
- Isolation multi-tenant sur `content.*` : Row-Level Security Postgres,
  jamais une simple clause `WHERE` côté code. Le rôle applicatif Drizzle
  n'est jamais propriétaire des tables.
- Le pont entre les deux mondes : un JWT émis par le C# au login, vérifié
  côté SvelteKit dans `hooks.server.ts`, sans appel réseau vers l'API C#.

## Topologie des apps (important : ne pas recopier l'ancien repo)

- Tout le code des projets vit sous `app/` à la racine (`app/api` pour le
  C#, `app/site-web`, `app/manager-web` plus tard), pour garder la racine
  du repo lisible face aux fichiers de conf/infra (`compose.yml`,
  `Makefile`, `.env`, futurs dossiers de déploiement). `app/` lui-même est
  une exception actée à la règle anti-anticipation ci-dessous : c'est un
  dossier de plomberie sans contenu métier, pas une anticipation de besoin.
  En revanche, ce que `app/` contient reste soumis à la règle : chaque
  sous-dossier n'est créé que lorsque son besoin est réel.
- Pas de `packages/` créé à l'avance. Un seul projet SvelteKit au départ
  (`app/site-web`), créé au moment où le premier rendu public en a
  besoin — pas avant.
- `app/manager-web` est un projet **séparé**, mais créé seulement quand le
  premier formulaire manager en a besoin. Séparé de `site-web` pour une
  vraie raison (le site public doit rester ~0 KB de JS ; le manager a besoin
  de formulaires riches) — pas par habitude de l'ancien repo.
- `app/platform-web` (admin/back-office) : **ne pas créer**, tant qu'il n'y a
  pas de vrai besoin opérationnel de gérer plusieurs tenants au quotidien.
  La création de tenant se teste au `curl` en attendant.
- `app/packages/site-themes` (ou équivalent partagé) : à créer seulement
  quand un **deuxième** layout existe réellement. Avant ça, le code de
  rendu vit directement dans `app/site-web/src/lib/`.

## Commandes

- `make start` : lance uniquement ce qui tourne en continu sans qu'on y
  touche — pour l'instant, Postgres (Docker). N'inclut jamais un process
  de dev qu'on relance sans arrêt (API .NET, SvelteKit) : ceux-là se
  lancent à la main, dans leur propre terminal, en foreground, avec le
  rechargement à chaud de l'outil (`dotnet watch run`, `npm run dev`) —
  jamais en arrière-plan via `make`, sinon chaque modification de code
  oblige à tuer/relancer un process cadré à la main.
- `make logs` : suit les logs de ce que `make start` a lancé (Docker
  pour l'instant). Les process en foreground (API, front) affichent déjà
  leurs logs dans leur propre terminal, pas besoin de les y ajouter.
- Rien d'autre tant que le besoin n'est pas réel. Ne pas ajouter de
  commande, de script, ou d'outil de manière spéculative.

## Workflow de session

- Un lot = une session = une branche = un commit. Jamais deux sujets
  mélangés dans la même session, même s'ils semblent liés.
- Une brique Svelte n'est valable que si : (1) elle touche peu de fichiers,
  (2) elle se vérifie par un geste concret en moins de 2 minutes (curl, test,
  page affichée), (3) je peux la réexpliquer avec mes mots juste après. Si un
  des trois manque, on redécoupe avant de continuer.
- Ne jamais anticiper un besoin qui n'existe pas encore (pas de règle, pas
  d'abstraction, pas de fichier de spec écrit avant qu'un cas réel ne
  l'exige).
- Commits : jamais de mention "Co-Authored-By: Claude", jamais de trailer
  ou de signature générée par l'outil. Message de commit uniquement, comme
  s'il avait été écrit par moi.

## NOTES.md

- Journal de décisions, pas un cahier des charges. 3-4 lignes ajoutées
  seulement quand une décision est prise et validée, pas avant.
- Format par entrée : quoi / pourquoi / comment c'est vérifié / commit lié.
- Ne pas relire tout `NOTES.md` à chaque session : ne consulter que la
  dernière entrée pertinente au sujet du jour, pour économiser du contexte.

## Ancien projet (`crystal_pharm-legacy`)

Lecture seule, jamais importé tel quel. Consulté à la demande, seulement
pour une question précise (ex. une règle a11y déjà tranchée) — jamais lu en
entier par défaut.