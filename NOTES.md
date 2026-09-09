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

## Layouts : un layout = un fichier, son genre déduit tout le reste

- Quoi : suppression des 6 `layout.meta.ts` et du contrat `supports`. Un
  layout se déclare dans le `<script module>` de son propre `.svelte`, via
  `defineLayout` / `definePartialLayout`, et ne déclare que ce qui aurait
  pu être différent : `kind` garantit ses modules, `plus` en ajoute un hors
  famille, `order` impose un ordre, `modules` n'existe que pour un partiel.
  Registre central des modules (`module-registry.ts`) + `registerLayout`
  comme point de passage obligé dans `index.ts`.
- Pourquoi : `supports` répétait ce que `kind` disait déjà (un
  `catalogue-complet` ne peut pas ne pas avoir brands/testimonials/team), et
  `pharmacyInfo: true` était recopié dans les 6 layouts. La même information
  était écrite 4 fois (ModuleKey, supports, Field, SiteData) sans que rien
  ne garantisse l'accord entre elles. Écrire un layout demandait de
  connaître ces subtilités par cœur ; désormais l'IDE les impose.
- Comment vérifié : `svelte-check` 0 erreur / 0 warning sur 120 fichiers ;
  rendu SSR identique avant/après (partiel toujours sans `description`,
  layouts fixes imposant leur ordre) ; et 6 fautes injectées volontairement
  puis retirées — module oublié au rendu, module oublié à l'appel, `order`
  incomplet (l'erreur nomme le module), `plus` redondant, champ inexistant,
  props divergentes du meta (erreur sur `registerLayout`).
- Commit lié : "Un layout se déclare lui-même : le genre déduit ses modules".
