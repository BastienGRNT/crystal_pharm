# `prescriptions` — les ordonnances reçues

Monté sur `/prescriptions` par `pharmacy/host`. Module C# : `Prescriptions`.
Données de santé.

- Un TenantMember qui a la Responsibility des ordonnances y retrouve celles
  envoyées depuis le site public et en suit le traitement.
- Pas de schéma propre : tous les appels passent par `src/server/api/`.
- Les réponses ne sont jamais mises en cache (posé par `pharmacy/host`).
- Les fichiers d’ordonnance ne passent jamais par Node : la route du fichier vérifie le droit, puis renvoie (303,
  `no-store`) vers un lien de lecture pré-signé de deux minutes, demandé au C# qui trace la lecture.
- Un identifiant opaque (UUID) dans une URL est autorisé ; une recherche par
  nom de patient se fait en POST, jamais dans l'URL.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
