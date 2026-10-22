# Le design system — `app/tools/ui/`

- `tokens/theme.css` : la seule source des couleurs, polices, rayons et
  espacements (clair et sombre).
- `atoms/` → `molecules/` → `organisms/` : dépendances descendantes
  uniquement. Composants faits main.
- Composants **purs** : props en entrée, callbacks en sortie. Aucun fetch,
  aucun store global, aucune connaissance d'un module ou du C#.
- `AppShell` (le cadre commun) reçoit les entrées du menu en props. La liste
  des outils est une simple donnée (`toolLinks.ts`) : ajouter un outil = une
  ligne.
- Les types partagés vont dans un `.ts`, jamais exportés depuis un `.svelte`.
- La référence visuelle des tokens et des composants : `docs/design-system/`.
