# `prescriptions` — les ordonnances reçues

Monté sur `/prescriptions` par `tools/host`. Module C# : `Prescriptions`.
Données de santé.

- Le Manager y retrouve les ordonnances envoyées depuis le site public et en
  suit le traitement.
- Pas de schéma propre : tous les appels passent par `src/server/api/`.
- Les réponses ne sont jamais mises en cache (posé par `tools/host`).
- Les fichiers d'ordonnance sont servis en flux depuis le C#, jamais copiés.
- Un identifiant opaque (UUID) dans une URL est autorisé ; une recherche par
  nom de patient se fait en POST, jamais dans l'URL.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
