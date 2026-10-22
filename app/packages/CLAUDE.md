# Le moteur — `app/packages/`

Zone protégée. Tu n'es ici que si la demande porte explicitement sur le
moteur. Sinon : tu t'arrêtes et tu le signales.

Consommé en `workspace:*` par `site` et `site-manager` : toute modification
les touche aussitôt. Après une modif, lance aussi leur typecheck (en lecture
seule).

## Les trois packages

- `schema` : le contrat des données d'un site (Valibot) et ses types. Aucune
  dépendance à Solid.
- `renderer` : la logique du rendu. Point d'entrée unique :
  `createTenantSitePage`, une fonction pure. Il ne produit ni HTML, ni JS,
  ni CSS, ne fait aucun `fetch`, ne connaît ni le tenant, ni le domaine, ni
  l'API. Ce dont il a besoin, l'app le lui fournit en paramètre.
- `layouts` : les layouts, du simple code source, sans build. Son export
  `/manifest` (réglages et zones de chaque layout) est du TypeScript pur, sans
  Solid : c'est ce que lit `site-manager`.

Sens des dépendances : `layouts → renderer → schema`, jamais l'inverse.
La doc du moteur : `docs/` (fonctionnement, création de layout, données,
prochaines étapes).

## Layouts

- Avant de créer ou de modifier un layout : lis `docs/creer-un-layout.md`.
- Un layout = un dossier, son nom est l'identifiant, découvert par les
  dossiers : aucune liste à tenir à jour.
- Un composant par module, sinon ça ne compile pas.
- Atomic design dans chaque layout ; tout son CSS est limité à `.layout-<id>`.
- Aucun import d'un layout à un autre.
- La maquette d'un layout est dans `docs/maquettes/<layoutId>/`. Elle se
  découpe en atoms → organisms selon `docs/creer-un-layout.md`, et ses
  couleurs et polices deviennent les variables du layout.

## Règles

- Moins on déclare, moins on oublie : découverte par dossiers et types plutôt
  que des listes écrites à la main.
- Pas de form builder, pas de kit qui rend de l'interface : le moteur type ce
  que le layout écrit, il ne l'écrit pas à sa place.
- Vérification : `pnpm --filter <package> check`.
