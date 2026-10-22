# Les apps — `app/apps/`

Chaque app est un projet indépendant : son `package.json`, son build, son
typecheck. `site/` est en SolidStart : les règles ci-dessous ne le concernent
pas, lis `site/CLAUDE.md`.

## Les apps SvelteKit (`home`, `site-manager`, `planning`, `booking`, `prescriptions`)

SvelteKit 2, Svelte 5 (runes), Tailwind 4, TypeScript strict.

- Servies sur le domaine des outils, une par chemin (`/`, `/site-manager`,
  `/planning`…) : chaque app pose son `kit.paths.base`. Même domaine, donc
  même cookie de session.
- `hooks.server.ts` utilise `shared/auth`. Sans utilisateur valide, on renvoie
  vers `home`.
- Le cadre de page vient de `AppShell` (`shared/ui`) : jamais de menu propre
  à une app.

## Front

- Atomic design : les composants communs viennent de `shared/ui` ; un
  composant métier reste dans son app ; un composant utilisé par deux apps
  part dans `shared/ui`.
- Couleurs, polices, rayons, espacements : uniquement les tokens de
  `shared/ui`, jamais de valeur en dur.
- Une maquette (cf. racine, « Docs et maquettes ») est une référence visuelle, pas du code à copier : elle se
  traduit en tokens et en composants de `shared/ui`, jamais en styles en dur.
- Une couleur, une taille ou un composant de la maquette absent de
  `shared/ui` : tu proposes le token ou le composant, tu ne l'inventes pas
  dans l'app. Une maquette en contradiction avec `shared/ui` : tu t'arrêtes
  et tu le signales.

## Structure par défaut (simple)

```
src/
├─ routes/                     pages, +page.server.ts (load, actions)
└─ lib/
   ├─ components/              composants métier, construits avec shared/ui
   ├─ domain/                  types et calculs purs, testés
   └─ server/
      ├─ services/             la logique, quand il y en a
      ├─ repositories/         SEUL endroit avec du Drizzle
      └─ api/                  SEUL endroit qui appelle le C# (shared/api-client)
```

- Ne **jamais** importer `$lib/server/` depuis un `.svelte` ou du code client.
- Une route ne fait jamais de Drizzle ni d'appel au C# elle-même : elle passe
  par `repositories/` ou `api/`.
- Un service n'existe que s'il apporte de la logique. Une app qui ne fait
  qu'afficher et envoyer appelle `api/` directement depuis la route.
- Typer explicitement les retours des `load`, actions et services.

## Quand une app grossit

On passe à des modules en couches (`lib/modules/<module>/domain` →
`application` → `infrastructure` → `presentation`). La décision se prend avec
nous : tu peux la proposer, pas l'appliquer.
