# Crystal Pharm, design system

Export autonome, direction « Logiciel métier », une couleur par module. Ouvrir `index.html` : couleurs, écrans des trois modules et tous les composants, en clair et en sombre.

| Dossier | Contenu |
| --- | --- |
| `index.html` | vitrine hors ligne |
| `css/styles.css` | tokens puis composants (classes `cp-`, bascule `data-module`) |
| `tokens/` | `tokens.json`, format W3C (`tokens.light.dtcg.json`, `tokens.dark.dtcg.json`), `tokens.css` |
| `fonts/` | Geist 400 à 700, licence SIL OFL |
| `logos/`, `icons/` | symbole, icônes Phosphor (licence MIT) |
| `components/` | fiche de chaque composant, `Icon.svelte`, `modules.ts` |

```html
<link rel="stylesheet" href="css/styles.css">
<body class="cp-root">
  <div data-module="planning"><button class="cp-btn">Ajouter un créneau</button></div>
</body>
```

---

## Guide de marque

Crystal Pharm est le logiciel de gestion de l'officine : équipe, planning, absences, puis le site de la pharmacie. Il doit avoir l'air d'un vrai logiciel métier, net et dense, utilisable entre deux patients. Une seule palette neutre pour toute l'application, et **une couleur par module** : le cerveau associe la couleur au module, et l'employé sait où il est d'un coup d'œil.

## Les modules et leur couleur

| Module | Couleur | Token | Icône |
| --- | --- | --- | --- |
| Équipe | bleu | `module-equipe` | users |
| Planning | vert | `module-planning` | calendar-dots |
| Absences | prune | `module-absences` | calendar-x |
| Site de la pharmacie (à venir) | sarcelle | `module-site` | globe-simple |
| Réglages | ardoise | `module-reglages` | gear-six |

- Poser `data-module="equipe"` (ou `planning`, `absences`, `site`, `reglages`) sur le conteneur du module. Les variables `--accent`, `--accent-hover`, `--accent-soft`, `--accent-text` et `--on-accent` prennent alors la couleur du module. Hors module (connexion), l'accent est `brand`.
- La couleur du module apparaît toujours aux mêmes endroits, et seulement là : la barre de 3px en haut du contenu, la tuile d'icône de l'en-tête de page, le lien actif de la navigation, le bouton principal, l'onglet actif, le focus des champs, les créneaux et le jour courant du planning.
- Dans la navigation, chaque lien garde l'icône à la couleur de son module, même inactif : c'est ce qui apprend l'association.
- Un composant ne code jamais une couleur de module en dur : il utilise `--accent`.
- Les statuts (Actif, En attente, Validé, Refusé) ont leurs propres couleurs, identiques dans tous les modules.
- Une absence dans le planning garde la teinte du module Absences (`absence`), pour relier les deux écrans.
- Ajouter un module : cinq tokens (`module-x`, `-hover`, `-soft`, `-text`, `on-module-x`), une ligne dans `bundle.css`, une icône. Le texte sur la couleur doit tenir 4.5:1 dans les deux thèmes, et la teinte doit rester distincte des modules existants.

## Ton et contenu

- Français, vouvoiement, phrases courtes et factuelles.
- Vocabulaire du code : **Titulaire, Pharmacien adjoint, Préparateur, Apprenti, Étudiant, Autre** ; **Congé, RTT, Arrêt maladie, Autre** ; **En attente, Validé, Refusé** ; **Actif / Inactif**.
- Boutons au verbe à l'infinitif (« Ajouter un employé », « Déclarer une absence », « Valider »).
- Dates en clair (« ven. 9 oct. », « 19 → 24 oct. », « Semaine 41 »), horaires `08:30–12:30`. Jamais d'ISO à l'écran.
- En-tête de page : un titre et une ligne de contexte chiffrée (« 4 employés · 3 actifs »).
- Erreurs : ce qui bloque et quoi faire. Pas de point d'exclamation, pas d'emoji. Aucun motif médical : « Arrêt maladie » seulement.

## Couleur

- Fond `surface` (blanc), navigation et en-têtes de tableau `surface-subtle`, survols et avatars `surface-muted`. Filets `line`, bordures de champs `line-strong` (3:1).
- Texte `ink`, secondaire `ink-muted`, métadonnées `ink-subtle` : 4.5:1 minimum sur toutes les surfaces, dans les deux thèmes.
- Chaque couleur de module tient 5.8:1 minimum avec son `on-module` et sur `surface`, dans les deux thèmes.
- Deux thèmes : Clair (défaut) et Sombre, via `data-theme` sur `<html>` ou le réglage de l'appareil.

## Typographie

- Une seule famille : **Geist** (400, 500, 600, 700).
- Échelle compacte de logiciel : `title-1` 24px pour la page, `title-2` 18px pour les cartes, `body` 14px pour le contenu, `small` 13px pour les métadonnées, `caption` 12px pour les en-têtes de colonnes, `overline` 11px en capitales pour les sections de navigation.
- Chiffres tabulaires pour les heures, dates et compteurs.

## Espacement, formes, profondeur

- Grille de 4px, `space-1` à `space-7`. Cellules à `space-4` horizontal, cartes à `space-5`, contenu à `space-6` des bords.
- Rayons : `radius-md` (6) boutons et champs, `radius-lg` (8) cartes, tableaux, tuiles, `radius-full` avatars et badges.
- Hauteurs : `control-md` 34px par défaut, `control-sm` 28px dans un tableau, `control-lg` 40px à la connexion.
- Ombres très légères (`shadow-xs`) sous les cartes et boutons, `shadow-md` pour ce qui flotte.

## États et interaction

- Focus clavier : contour 2px à la couleur du module, décalé de 2px. Champs : bordure + halo `accent-soft`.
- Survol : lignes de tableau en `surface-subtle`, boutons secondaires en `surface-muted`, boutons principaux en `accent-hover`.
- Transitions de 120ms sur les couleurs, rien d'autre.

## Composants

Classes CSS `cp-` dans `components/bundle.css`, sans JavaScript. Charger `tokens.css` puis `bundle.css`, `class="cp-root"` sur `<body>`, `data-module` sur le conteneur du module.

- Fondations : `Modules`.
- Actions : `Button`.
- Formulaires : `Field`, `Card`.
- Données : `Table`, `AbsenceTable`, `Request`, `Status`, `Tag`, `Avatar`.
- Navigation : `SideNav`, `TopBar`, `PageHeader`, `Tabs`.
- Planning : `PlanningGrid`, `WeekNav`.
- Retour : `Alert`, `EmptyState`.
- Écrans : `PageEquipe`, `PagePlanning`, `PageAbsences`, `LoginScreen`.

## Logo et iconographie

- Symbole : croix de pharmacie taillée en cristal, aux verts `brand`, versions claire, sombre et monochrome (`assets/Logos/`). Il ne change jamais de couleur avec les modules. Toujours suivi de « Crystal Pharm » en Geist 600.
- Icônes : **Phosphor regular**, 18px dans la navigation, 16px dans les boutons, 22px dans la tuile d'en-tête. Toujours avec un libellé, ou un `aria-label` pour un bouton icône seul.

## Non synchronisé

Le dépôt `crystal_pharm` ne contenait aucun style : ce système a été créé à partir des écrans existants (Équipe, Planning, Absences, Connexion) et du schéma Drizzle, dans la direction « Logiciel métier » choisie par Louise, avec une couleur par module. Le package `app/packages/design-system` en est la copie de code. Le module Site est préparé mais n'existe pas encore dans l'application.
