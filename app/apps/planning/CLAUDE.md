# `planning` — le planning de l'équipe

Servie sur `/planning`. Module C# : `Planning`.

- On affiche et on envoie : **toutes les règles** (créneaux, chevauchements,
  contraintes de présence) vivent dans le C#.
- Pas de Drizzle : tous les appels passent par `lib/server/api/`.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
- `booking` dépend des disponibilités du planning : ce lien vit dans le C#,
  jamais entre les deux apps.
