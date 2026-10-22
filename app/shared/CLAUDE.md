# Partagé — `app/shared/`

Modifiable. Un changement ici touche plusieurs apps : garde la compatibilité
(ajouter plutôt que renommer ou supprimer). Tu ne modifies pas les apps qui
l'utilisent dans la même session : tu lances leur typecheck et tu signales.

Seul `ui` existe pour l'instant. `auth`, `api-client` et `content-db` sont
créés avec leur premier besoin réel, selon les règles ci-dessous.

## Dépendances entre packages partagés

`ui`, `auth` et `api-client` ne dépendent d'aucun autre package partagé.
`content-db` dépend seulement de `packages/schema`.

## `ui` — l'interface commune des apps Svelte

- `tokens/theme.css` : la seule source des couleurs, polices, rayons et
  espacements (clair et sombre).
- `atoms/` → `molecules/` → `organisms/` : dépendances descendantes
  uniquement. Composants faits main, Tailwind 4.
- Composants **purs** : props en entrée, callbacks en sortie. Aucun fetch,
  aucun store global, aucune connaissance d'une app ou du C#.
- `AppShell` (le cadre commun) reçoit les entrées du menu en props. La liste
  des outils est une simple donnée (`toolLinks.ts`) : ajouter un outil = une
  ligne.
- Les types partagés vont dans un `.ts`, jamais exportés depuis un `.svelte`.
- La référence visuelle des tokens et des composants communs :
  `ui/docs/design-system/`.

## `auth` — vérifier, jamais émettre

- Le hook SvelteKit : lit le cookie, vérifie l'access token (JWKS de
  l'API mis en cache, `kid`, `iss`, `aud`), le renouvelle avec le refresh
  token s'il a expiré, remplit `locals.user` (`userId`, `tenantId`, rôles).
- Ne connaît jamais la clé privée, ne crée jamais de token.

## `api-client` — généré

Produit par `make gen-types`. **Jamais édité à la main** : un type faux se
corrige dans le C#, puis on régénère.

## `content-db` — le schéma `content`

- Le schéma Drizzle `content` et ses migrations (le seul endroit où elles
  vivent).
- Les fonctions de lecture du `TenantSite`, validé par `packages/schema`.
  Les écritures vivent dans `site-manager`.
- Chaque requête passe par la Row-Level Security (cf. racine, « Base de
  données »).
