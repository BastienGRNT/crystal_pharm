---
name: archi
description: Audit d'architecture du repo. Vérifie que les CLAUDE.md sont cohérents entre eux, puis que le code, les dépendances et la configuration respectent leurs règles. Lecture seule, rapport classé par gravité.
disable-model-invocation: true
---

# /archi — audit d'architecture

Tu audites, tu ne corriges rien. Aucun fichier n'est modifié pendant ce
skill, même pour une correction évidente : tu la proposes dans le rapport.

Argument facultatif : une zone (`booking`, `api`, `ui`…) pour limiter
l'audit. Sans argument, tout le repo.

## 1. Les CLAUDE.md entre eux

Lis tous les `CLAUDE.md` du repo (`git ls-files '*CLAUDE.md'`) et cherche :

- les contradictions : deux fichiers qui disent l'inverse ;
- les doublons : une règle écrite à deux endroits (« une règle, un seul
  endroit ») ;
- les références dans le vide : un fichier, un dossier, une commande ou un
  package cité qui n'existe pas, sans être marqué « créé avec son premier
  besoin » ;
- les règles ambiguës pour une IA : un mot qui peut se lire de deux façons,
  une règle sans critère vérifiable ;
- la taille : la racine au-delà de sa limite, un fichier de zone qui répète
  la racine.

## 2. Le repo face aux règles

Pour chaque règle vérifiable, cherche les écarts dans le code. Au minimum :

- **Dépendances** : chaque `package.json` ne déclare que ce que le tableau
  « Dépendances autorisées » permet ; aucun module n'importe un autre module ;
  aucune app n'importe une autre app ; aucun composant Solid dans du Svelte ;
  `layouts → renderer → schema`.
- **Moteur** : aucune modification de `app/engine/renderer` ou
  `app/engine/schema` hors d'une branche dont le scope est `renderer` ou
  `schema` (`git log --name-only develop..HEAD`).
- **Svelte** : aucun import de `server/` ou d'un `*.server.ts` depuis un
  `.svelte` ; aucun Drizzle hors des `src/server/repositories/` des modules et
  de `shared/`, et des `src/lib/server/repositories/` de `group` et `admin` ;
  aucun appel au C# hors de `src/server/api/` ; aucune logique dans
  `pharmacy/host/src/routes/` (au-delà d'importer et de ré-exporter) ;
  aucune couleur ou police en dur (hex, `rgb(`, nom de
  police) hors des tokens ; aucun `any`.
- **Auth** : aucun import de l'auth de `admin` ailleurs ; dans `admin`, aucun
  import de `@crystal-pharm/auth` (l'entrée des comptes clients), seulement
  `/toolkit`, `/tables` et `/client` ; aucune table `platform_auth` lue hors
  d'`admin` ; aucun secret partagé entre les deux identités.
- **Schémas** : chaque schéma n'est migré que par son propriétaire (cf.
  racine, « Base de données ») ; aucun `insert`, `update` ou `delete` sur les
  tables d'un autre propriétaire (ex. `pharmacy` hors de `shared/pharmacy-db`).
- **Contrat TS → C#** : si `planning.staff_availability` a changé sur la
  branche, le mapping de `Booking` a changé dans la même branche.
- **API versionnées** : aucun champ, paramètre ou route retiré ou renommé
  dans un `routes/api/v<n>/` existant (`git diff develop...HEAD`).
- **C#** : aucun projet de module qui référence un projet d'un autre module
  autre que son `Contracts` (lire les `.csproj`) ; `Booking` et
  `Prescriptions` indépendants ; rien de `public` dans `Infrastructure`
  hors `<Module>ModuleRegistration` et les migrations générées ; aucun `IgnoreQueryFilters`,
  `EnableSensitiveDataLogging`, ni `TenantId =` posé à la main ; aucune entité
  renvoyée par un controller ; aucun secret dans `appsettings*.json` ; aucun
  `!` sans commentaire.
- **Données de santé** : aucune donnée de `booking` ou `prescriptions` dans un
  log, une URL, un cache ou un fichier côté Node, ni lue par `group` ou
  `admin` ; aucune clé étrangère entre
  un schéma de santé et un autre.
- **Généré** : `shared/api-client` n'a pas été édité à la main.
- **Rangement** : aucun dossier de plus de ~8 éléments à plat ; aucun dossier
  pour un seul fichier hors structure imposée ; noms explicites, sans
  abréviation.
- **Git** : la branche courante suit `<type>/<scope>/<sujet>` ; les commits
  de la branche suivent `<type>(<scope>): <sujet>` et ne contiennent aucun
  trailer d'outil.

Vérifie ce qui se vérifie par lecture et par recherche (`git`, `grep`, lecture
de fichiers). Ne lance ni build, ni serveur, ni installation.

## 3. Le rapport

Un tableau par partie, trié par gravité, puis une synthèse de 3 lignes :

| Gravité | Où (`fichier:ligne`) | Écart | Règle concernée | Correction proposée |
|---|---|---|---|---|

Gravité : 🔴 bloquant (sécurité, données de santé, isolation entre tenants) ·
🟠 important (architecture, dépendances) · 🟡 à corriger (cohérence,
rangement) · 🟢 détail.

Si une partie n'a aucun écart, dis-le en une ligne. Ne signale pas ce qui
n'existe pas encore et qui est marqué comme créé plus tard.
