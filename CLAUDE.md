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
- Exception à l'anti-anticipation : `app/packages/layouts` (le système
  de layouts) est créé et développé **avant** `site-web` et `manager-web`,
  car c'est le cœur partagé par les deux. Il est développé et vérifié en
  vase clos, avec des données mockées en dur, sans dépendre de `site-web`,
  `manager-web`, d'un tenant, d'une base ou de l'API C#. `site-web`, quand
  il naîtra, démarre avec **zéro** code de layout dedans (pages plomberie
  du type `<p>{tenant.nom}</p>` pour vérifier routing/tenant/auth) ; le
  branchement au vrai rendu via `layouts` vient dans une brique
  séparée, une fois la plomberie et le layout validés chacun de son côté.
- `app/manager-web` est un projet **séparé**, mais créé seulement quand le
  premier formulaire manager en a besoin. Séparé de `site-web` pour une
  vraie raison (le site public doit rester ~0 KB de JS ; le manager a besoin
  de formulaires riches) — pas par habitude de l'ancien repo.
- `app/platform-web` (admin/back-office) : **ne pas créer**, tant qu'il n'y a
  pas de vrai besoin opérationnel de gérer plusieurs tenants au quotidien.
  La création de tenant se teste au `curl` en attendant.
- `app/packages/layouts` : contrat de modules sans variante `bespoke`.
  Tout layout a ses modules éditables/activables côté manager, sans
  exception ; un layout atypique ou réservé à un tenant reste un layout
  normal, avec un module exclusif en plus — jamais un formulaire manager
  câblé en dur par module. La forme canonique d'un module reste unique
  (dérivée à terme du contrat C#/NSwag) ; les données d'un site restent
  layout-agnostiques, un changement de layout ne perd jamais une donnée
  saisie même si le nouveau layout ne l'affiche pas.
- Un layout tient dans **un seul fichier** : son `.svelte`, qui se déclare
  lui-même dans son `<script module>` via `defineLayout` (ou
  `definePartialLayout`). Pas de fichier de config à côté. Un layout ne
  déclare **que ce qui aurait pu être différent** : son genre (`kind`)
  suffit à garantir ses modules, `plus` ajoute un module hors famille,
  `order` impose un ordre (et rend le layout non réordonnable), `modules`
  n'existe que pour un layout partiel. Les modules `main` sont implicites
  partout et ne s'écrivent jamais.
- Ajouter un module au produit = une ligne dans `src/module-registry.ts`,
  rien à répercuter dans les layouts. Un layout n'est publié que via
  `registerLayout` (`src/index.ts`), qui confronte ce qu'il déclare à ce
  que son composant accepte : un layout en désaccord avec lui-même échoue
  là, pas chez celui qui l'utilise.
- Ces garanties sont uniquement statiques ; `make dev-layout` et
  `svelte-check` sont le filet. Quand les données viendront de l'API C# au
  lieu des mocks, une validation à l'exécution restera à ajouter.

## Commandes

- `make start` : lance uniquement ce qui tourne en continu sans qu'on y
  touche — pour l'instant, Postgres (Docker).
- `make api` : lance l'API .NET avec rechargement à chaud (`dotnet watch
  run`), toujours en foreground dans son propre terminal — jamais en
  arrière-plan (pas de `&`, pas de détachement). Ctrl+C dans ce terminal
  tue le process normalement, comme un lancement direct : `make` ne fait
  ici qu'exécuter la commande, pas la détacher.
- `make dev-layout` : lance la page de preview des layouts (Vite,
  `app/packages/layouts`), en foreground dans son propre terminal comme
  `make api`. Ne dépend ni de la base, ni de l'API : rendu sur mocks.
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