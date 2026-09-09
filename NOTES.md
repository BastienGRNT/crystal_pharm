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
