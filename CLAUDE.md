# CLAUDE.md

Ce fichier est la seule source de vérité sur l'architecture et le workflow.
Il reste volontairement court. S'il dépasse ~150 lignes, on en reparle avant
d'en ajouter — on éclate en fichiers séparés à ce moment-là, pas avant.

## Stack et frontière de responsabilité

- **C# (.NET)** : tenant, authentification (Identity + cookie + JWT émis au
  login), et plus tard tout ce qui touche au paiement ou à une règle métier
  vraiment critique. Développé et validé par lots larges — pas de
  micro-découpage ici, la maîtrise C# est déjà acquise.
- **SvelteKit + Drizzle** : tout le reste (sites, modules de contenu,
  rendu public, formulaires manager). Développé **brique par brique**, chaque
  brique testable seule avant la suivante.
- Une seule base Postgres, deux schémas :
  - `platform` (Tenant, Identity...) → migré **uniquement** par EF Core.
  - `content` (Site, SiteModule...) → migré **uniquement** par Drizzle.
  - Règle absolue : un schéma = un seul outil de migration, jamais les deux.
- Isolation multi-tenant sur `content.*` : Row-Level Security Postgres,
  jamais une simple clause `WHERE` côté code. Le rôle applicatif Drizzle
  n'est jamais propriétaire des tables.
- Le pont entre les deux mondes : un JWT émis par le C# au login, vérifié
  côté SvelteKit dans `hooks.server.ts`, sans appel réseau vers l'API C#.

## Topologie des apps (important : ne pas recopier l'ancien repo)

- Pas de dossier `apps/` à plusieurs entrées ni de `packages/` créés à
  l'avance. Un seul projet SvelteKit au départ (`site-web`), créé au moment
  où le premier rendu public en a besoin — pas avant.
- `manager-web` est un projet **séparé**, mais créé seulement quand le
  premier formulaire manager en a besoin. Séparé de `site-web` pour une
  vraie raison (le site public doit rester ~0 KB de JS ; le manager a besoin
  de formulaires riches) — pas par habitude de l'ancien repo.
- `platform-web` (admin/back-office) : **ne pas créer**, tant qu'il n'y a
  pas de vrai besoin opérationnel de gérer plusieurs tenants au quotidien.
  La création de tenant se teste au `curl` en attendant.
- `packages/site-themes` (ou équivalent partagé) : à créer seulement quand
  un **deuxième** layout existe réellement. Avant ça, le code de rendu vit
  directement dans `site-web/src/lib/`.

## Commandes

- `start` : lance Postgres (Docker), l'API C#, l'app SvelteKit.
- `logs` : suit les logs des trois.
- Rien d'autre tant que le besoin n'est pas réel. Ne pas ajouter de commande,
  de script, ou d'outil de manière spéculative.

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
