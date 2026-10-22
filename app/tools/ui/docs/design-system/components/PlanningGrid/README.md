# PlanningGrid

Grille hebdomadaire : une ligne par employé, une colonne par jour.

- Créneau `cp-slot` : fond `accent-soft` et trait gauche `accent` (vert dans le module Planning), horaire en chiffres tabulaires.
- Absence : `td.is-absent`, teinte du module Absences, pour relier visuellement les deux modules.
- Jour courant : `th.is-today`, numéro dans une pastille `accent`.
- Suppression d'un créneau au survol ou au focus clavier, toujours visible sur tactile.
