# Les modules — `app/pharmacy/modules/`

Chaque outil est un module : un package Svelte 5 (runes), monté par
`pharmacy/host`. Un module ne se déploie jamais seul.

## Frontières

- Un module n'importe **jamais** un autre module : ce qui doit être partagé
  va dans `ui` (de l'interface) ou dans `shared/` (du TS sans interface).
- Sa partie publique est déclarée dans les `exports` de son `package.json` :
  `.` pour les pages (code client), `./server` pour ce que les routes de
  `pharmacy/host` appellent côté serveur (`load`, actions, endpoints). Rien
  d'autre n'est importable.
- Le code serveur vit dans `src/server/`, et ses fichiers d'entrée se nomment
  `*.server.ts` : SvelteKit refuse alors de les envoyer au navigateur. Jamais
  d'import de `server/` depuis un `.svelte`.

## Structure

```
src/
├─ index.ts                 la partie publique côté client (les pages)
├─ pages/                   un composant par écran, qui reçoit ses données en props
├─ components/              composants métier en atomic design (atoms/ → molecules/ → organisms/), construits avec ui
├─ domain/                  types et calculs purs, testés
├─ server/
│  ├─ index.server.ts       la partie publique côté serveur (load, actions, endpoints)
│  ├─ db/                   le schéma Drizzle du module et ses migrations (s'il en possède un)
│  ├─ services/             la logique, quand il y en a
│  └─ repositories/         SEUL endroit avec du Drizzle sur les tables du module
└─ api/                     SEUL endroit qui appelle le C#, depuis le navigateur (shared/api-client)
```

- Chaque dossier est créé avec son premier fichier.
- Une page ne fait jamais de Drizzle : elle reçoit ses données du `load` de
  `server/`, qui passe par `repositories/` ou les fonctions de
  `shared/pharmacy-db`.
- Les données de santé ne passent jamais par `server/` : la page les demande
  au C# par `src/api/` (le JWT court de `pharmacy/host` en mémoire), les
  garde en mémoire et les envoie de même. Le `load` d'un tel écran ne donne
  que le reste (noms des Employees, droits…).
- Un service n'existe que s'il apporte de la logique, sauf si le module
  expose une API : alors toute la logique est dans `services/`, appelée à la
  fois par les pages et par l'API.
- Typer explicitement les retours des `load`, actions, endpoints et services.

## Quand un module grossit

On découpe son `src/` en sous-dossiers en couches (`domain` → `application`
→ `infrastructure` → `presentation`). La décision se prend avec nous : tu peux
la proposer, pas l'appliquer.
