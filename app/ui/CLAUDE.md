# Le design system — `app/ui/`

Commun aux trois apps Svelte (`pharmacy`, `group`, `admin`) : rien ici ne
connaît l'une d'elles. Direction « Santé » (IBM Plex Sans, colonne de
navigation sombre).

- `tokens/theme.css` : la seule source des couleurs, polices, rayons et
  espacements (clair et sombre), y compris une couleur par module (`ModuleKey`
  de `modules.ts`) : `data-module` sur un conteneur fait basculer l'accent. Un
  module sans couleur garde l'accent de la marque ; une nouvelle couleur se
  propose.
- `atoms/` → `molecules/` → `organisms/` : dépendances descendantes
  uniquement. Composants faits main.
- Composants **purs** : props en entrée, callbacks en sortie. Aucun fetch,
  aucun store global, aucune connaissance d'une app, d'un module ou du C#.
- `AppShell` (la colonne `SideNav`, la barre `TopBar`, le contenu) reçoit le
  menu en props (`navigationLinks`) et la personne connectée : chaque app
  tient sa propre liste.
- Les écrans communs aux trois apps vivent ici : `AuthenticationScreen`,
  `LoginForm`, `RegisterForm` (l'envoi est un callback, qui renvoie le message
  d'échec), `ThemeToggle` (le thème choisi, posé avant l'affichage par le
  script de `app.html` de chaque app). Un champ = `Field` + `Input`.
- Une app prend sa couleur principale par le `data-module` de son `<body>`
  (`app.html`), jamais en dur dans un composant.
- Les types partagés vont dans un `.ts`, jamais exportés depuis un `.svelte`.
- La référence visuelle : `tokens/theme.css` et les composants.
  `docs/design-system/` est l'ancienne direction (« Logiciel métier ») : ne
  pas la suivre.
