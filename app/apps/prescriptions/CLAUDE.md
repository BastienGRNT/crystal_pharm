# `prescriptions` — les ordonnances reçues

Servie sur `/prescriptions`. Module C# : `Prescriptions`. Données de santé.

- Le Manager y retrouve les ordonnances envoyées depuis le site public et en
  suit le traitement.
- Pas de Drizzle : tous les appels passent par `lib/server/api/`.
- `Cache-Control: no-store` sur toutes les réponses (posé dans le hook).
- Les fichiers d'ordonnance sont servis en flux depuis le C#, jamais copiés.
- Un identifiant opaque (UUID) dans une URL est autorisé ; une recherche par
  nom de patient se fait en POST, jamais dans l'URL.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
