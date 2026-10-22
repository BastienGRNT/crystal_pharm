# Le design system — `app/ui/`

Commun aux trois apps Svelte (`pharmacy`, `group`, `admin`) : rien ici ne
connaît l'une d'elles.

- `tokens/theme.css` : la seule source des couleurs, polices, rayons et
  espacements (clair et sombre), y compris une couleur par module :
  `data-module` sur un conteneur fait basculer l'accent. Un module sans
  couleur garde l'accent de la marque ; une nouvelle couleur se propose.
- `atoms/` → `molecules/` → `organisms/` : dépendances descendantes
  uniquement. Composants faits main.
- Composants **purs** : props en entrée, callbacks en sortie. Aucun fetch,
  aucun store global, aucune connaissance d'une app, d'un module ou du C#.
- `AppShell` (le cadre commun : navigation latérale, barre du module, fil
  d'Ariane) reçoit le menu en props (`navigationSections`) et la personne
  connectée : chaque app tient sa propre liste.
- Les écrans communs aux trois apps vivent ici : `AuthenticationScreen`,
  `LoginForm`, `RegisterForm` (l'envoi est un callback, qui renvoie le message
  d'échec), `ThemeToggle` (le thème choisi, posé avant l'affichage par le
  script de `app.html` de chaque app).
- Une app change sa couleur principale en surchargeant les tokens d'accent
  dans son `app.css`, jamais en dur dans un composant.
- Les types partagés vont dans un `.ts`, jamais exportés depuis un `.svelte`.
- La référence visuelle des tokens et des composants : `docs/design-system/`.
