# `booking` — les rendez-vous

Monté sur `/booking` par `pharmacy/host`. Module C# : `Booking`. Données de santé.

- On affiche et on envoie : **toutes les règles** (disponibilités,
  concurrence, file d'attente) vivent dans le C#.
- Pas de schéma propre : les rendez-vous sont lus et écrits par la page,
  directement auprès du C# (`src/api/`) ; les noms des Employees viennent du
  `load` (`shared/pharmacy-db`).
- Les réponses ne sont jamais mises en cache (posé par `pharmacy/host` et par
  le C#).
- Un identifiant opaque (UUID) dans une URL est autorisé ; une recherche par
  nom de patient se fait en POST, jamais dans l'URL.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
