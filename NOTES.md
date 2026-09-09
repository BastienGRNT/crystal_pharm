<!-- Journal de décisions. Une entrée seulement quand une décision est
     prise et validée. Format : quoi / pourquoi / comment vérifié / commit. -->

## Solution C# : Tenant + Auth Identity/JWT

- Quoi : solution .NET à 4 projets (Domain, Application, Infrastructure,
  Api), API en Controllers, DDD lite. AuthController (register/login/logout/me)
  sur Identity (cookie) + émission d'un JWT (HMAC, secret via `.env`) au
  login et au register. Migration EF Core créant Tenant + tables Identity,
  tout dans le schéma `identity`.
- Pourquoi : c'est la brique d'auth/tenant décrite dans la section
  "Stack et frontière de responsabilité" de CLAUDE.md — le JWT est le pont
  vers SvelteKit (vérifié plus tard côté `hooks.server.ts`, sans appel
  réseau vers l'API).
- Comment vérifié : `curl POST /auth/register`, `curl POST /auth/login`
  (même tenantId dans le JWT décodé sur jwt.io), `curl GET /auth/me` avec
  le cookie (tenantId identique), `curl POST /auth/logout` puis `/auth/me`
  → 401.
- Commit lié : "archi C# : Tenant + Auth Identity/JWT (Controllers, DDD lite)".

## Layouts : le genre impose les modules, le compilateur impose le reste

- Quoi : `app/packages/layouts` reconstruit. Un layout = un dossier avec un
  `layout.ts` (id, `kind`, `orderable`, `plus`, et `sections` qui associe un
  composant à chaque module) et un composant Svelte par module. Registre
  unique des modules dans `src/modules/registry.ts` (donnée + famille), un
  seul composant de rendu (`LayoutHost`) pour tous les layouts.
- Pourquoi : la version précédente demandait, pour ajouter un module,
  d'écrire un import, un snippet, une entrée de `sections` et une prop dans
  chaque layout — intenable à 15 modules — et ses erreurs vivaient dans des
  `.svelte`, que WebStorm ne type-check pas : elles étaient donc invisibles
  pendant le développement. La restriction de champs par layout a été
  supprimée : elle imposait aux organisms de se typer depuis le meta, ce qui
  créait une boucle de types interdisant cette structure. À réintroduire le
  jour où le manager en aura besoin.
- Comment vérifié : `svelte-check` 0 erreur / 0 warning ; rendu SSR conforme
  (`orderable: false` impose l'ordre du layout, `true` suit celui du site,
  un module non activé n'est pas affiché) ; trois fautes injectées puis
  retirées, toutes signalées **dans un `.ts`** et nommant le module : ajout
  d'un module catalogue au registre (les 3 layouts catalogue et les mocks
  échouent, les layouts unique non), module oublié dans `sections`,
  composant branché sur la mauvaise clé.
- Commit lié : "Reconstruit le package layouts : un layout = un layout.ts".
