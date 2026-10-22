# `booking` — les rendez-vous

Servie sur `/booking`. Module C# : `Booking`. Données de santé.

- On affiche et on envoie : **toutes les règles** (disponibilités,
  concurrence, file d'attente) vivent dans le C#.
- Pas de Drizzle : tous les appels passent par `lib/server/api/`.
- `Cache-Control: no-store` sur toutes les réponses (posé dans le hook).
- Un identifiant opaque (UUID) dans une URL est autorisé ; une recherche par
  nom de patient se fait en POST, jamais dans l'URL.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
