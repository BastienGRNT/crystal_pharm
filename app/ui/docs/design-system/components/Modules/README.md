# Modules

Une couleur d'accent par module, sur une palette neutre commune : l'employé sait où il est d'un coup d'œil.

| Module | Token | Clair | Sombre | Icône |
| --- | --- | --- | --- | --- |
| Équipe | `module-equipe` | bleu #2552c4 | #8fb0ff | users |
| Planning | `module-planning` | vert #0f6b4f | #5fd1a5 | calendar-dots |
| Absences | `module-absences` | prune #8a2f6b | #f09ad0 | calendar-x |
| Site (à venir) | `module-site` | sarcelle #0b6f7a | #5fcfd9 | globe-simple |
| Réglages | `module-reglages` | ardoise #3f4a5a | #b3bdcc | gear-six |

Poser `data-module="<clé>"` sur le conteneur du module (en pratique `cp-shell__main`) : `--accent`, `--accent-hover`, `--accent-soft`, `--accent-text` et `--on-accent` basculent tout seuls. Hors module (connexion), l'accent est `brand`. Ne jamais coder une couleur de module en dur dans un composant : passer par `--accent`.
