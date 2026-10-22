# SideNav

Navigation latérale (`cp-nav`) sur `surface-subtle`.

- Chaque lien `cp-nav__link` porte son propre `data-module` : son icône est toujours à la couleur de son module, ce qui apprend l'association couleur ↔ module.
- Lien courant : `aria-current="page"`, fond teinté de son module.
- Compteur `cp-count--warning` pour les demandes en attente.
- En bas : Réglages et l'utilisateur connecté (`cp-nav__me`).
