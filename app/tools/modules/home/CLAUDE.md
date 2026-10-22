# `home` — accueil, connexion, fiche de la pharmacie

Monté sur `/` par `tools/host`.

- Les écrans de connexion et de déconnexion (Better Auth est configuré dans
  `shared/auth` et servi par `tools/host`).
- La page d'accueil liste les outils ; le menu vient de `AppShell`.
- La fiche de la pharmacie (coordonnées) et ses Employees : lues et écrites
  par les fonctions de `shared/pharmacy`, jamais par une requête Drizzle
  propre à `home`.
- Pas de schéma propre.
