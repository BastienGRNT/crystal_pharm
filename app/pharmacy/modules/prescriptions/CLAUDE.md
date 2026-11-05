# `prescriptions` — les ordonnances reçues

Monté sur `/prescriptions` par `pharmacy/host`. Module C# : `Prescriptions`.
Données de santé.

- Un TenantMember qui a la Responsibility des ordonnances y retrouve celles
  envoyées depuis le site public et en suit le traitement.
- Pas de schéma propre : les ordonnances sont lues et modifiées par la page,
  directement auprès du C# (`src/api/`) ; rien ne passe par `src/server/`.
- Les réponses ne sont jamais mises en cache (posé par `pharmacy/host` et par
  le C#).
- Un fichier d’ordonnance est lu par `ReceivedDocumentCard` auprès du C#, qui
  vérifie le droit, trace la lecture et le renvoie en flux ; la page l’affiche
  depuis la mémoire (`blob:`), jamais dans un `href`, une barre d’adresse ni
  l’historique.
- L’email « prête » au patient part du C#, pas d’ici.
- Un identifiant opaque (UUID) dans une URL est autorisé ; une recherche par
  nom de patient se fait en POST, jamais dans l'URL.
- Une règle qui manque côté C# ne se recode pas ici : tu le signales, ça se
  fait dans une session `api`.
