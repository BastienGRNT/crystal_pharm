# `planning` — le planning de l'équipe

Monté sur `/planning` par `pharmacy/host`. Possède le schéma `planning`
(`src/server/db/`).

- **Toutes les règles** du planning vivent ici, en TypeScript : créneaux,
  chevauchements, absences, contraintes de présence.
- Les Employees viennent de `shared/pharmacy-db` : jointure autorisée pour les
  lire, ses fonctions pour les écrire.
- La vue `planning.staff_availability` est créée et migrée ici, et lue par le
  C# `Booking`. Ses colonnes sont un contrat (cf. racine, « Contrats ») :
  tout changement se fait avec la modification du C# dans la même branche.
- **L'app mobile** consommera l'API du module, exposée par `pharmacy/host` sous
  `/api/v1/planning/`, authentifiée par le jeton porteur de `shared/auth`,
  versionnée selon la racine. Toute la logique est donc dans
  `src/server/services/`, appelée à la fois par les pages et par l'API :
  jamais de règle dans un handler.
