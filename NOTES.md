<!-- Journal de décisions. Une entrée seulement quand une décision est
     prise et validée. Format : quoi / pourquoi / comment vérifié / commit. -->

## Atomic design dans les designs, et le sceau verrouillé

- Quoi : chaque design est découpé en `organisms/` (une section entière,
  appelée par son snippet), `molecules/` et `atoms/`, propres au design — un
  `Page.svelte` ne garde que le contrat et l'ordre (22 lignes pour `classique`
  contre 290). En parallèle, `seal` n'est plus exporté nulle part : les
  analyseurs de `src/sections/` rendent du contenu nu et `registry.ts` est le
  seul fichier du dépôt capable de sceller. La section designs de `CLAUDE.md`
  est partie dans `app/packages/designs/CLAUDE.md` — chargé automatiquement
  quand on travaille dans le package (le fichier racine dépassait sa
  propre limite de ~150 lignes ; il est retombé à 124).
- Pourquoi : le `Page.svelte` d'un design portait tout son HTML, ce qui le
  rendait illisible dès 6 sections. Le découpage ne coûte rien au contrat : la
  promesse est portée par la **déclaration** du snippet, pas par son contenu.
  Pour le sceau, la suppression de l'assembleur avait emporté avec elle le
  garde-fou qui interdisait à un design d'importer `seal` : le rendre
  inexportable remplace un outil externe par une impossibilité structurelle.
- Comment vérifié : `svelte-check` 0 erreur / 0 warning sur 148 fichiers ;
  `make dev-design` sert la preview. Fautes injectées puis retirées : snippet
  `team` retiré d'un design `complete` (`Property 'team' is missing` — la
  garantie survit au découpage), `import { seal }` dans un design (`has no
  exported member 'seal'`). Rendu SSR identique à avant découpage sur les
  4 designs et les 3 jeux de mocks, hostile compris. Limite constatée et
  documentée : retaper le type d'un sous-composant au lieu de le dériver
  élargit `TrustedImageUrl` en `string` sans aucune erreur.
- Commit lié : "Découpe les designs en atomic design et verrouille le sceau".

## Le layout devient un design, et l'étiquette devient le curseur

- Quoi : `app/packages/layouts` remplacé par `app/packages/designs`. Un
  *design* est ce que le pharmacien choisit, une *section* un bloc de sa page,
  une *assurance* la promesse portée par le design (`complete`, `signature`,
  `custom`). L'assurance n'est plus une famille technique : c'est elle qui
  décide de la quantité de vérification. Un design tient en deux fichiers —
  `design.ts` (nom, gamme, réordonnable) et `Page.svelte`, où tout son HTML vit,
  une section par `{#snippet}` recevant son contenu déjà scellé en paramètre.
  L'hôte de gamme pose les sections côte à côte, donc la loi des frères est
  structurelle. Frontière de validation : tout contenu entre en `unknown` et ne
  ressort que scellé (`Trusted<T>`, `TrustedUrl`).
- Pourquoi : la version précédente obligeait chaque layout à redire ce que sa
  famille impliquait déjà (`kind` + `sections`) et bridait le design — or il
  faut pouvoir faire des designs originaux qui refusent des sections sans
  décevoir un pharmacien. Une première tentative a remplacé cette config par un
  fichier assemblé (`tools/assemble.mjs` + `src/generated/designs.ts`) : pire,
  puisqu'il fallait alors *fabriquer* un artefact pour que le code fonctionne.
  Les snippets Svelte 5 donnent la même garantie sans rien générer : les
  snippets requis par l'hôte de gamme sont des props obligatoires, donc c'est
  `svelte-check` seul qui nomme la section manquante.
- Comment vérifié : `svelte-check` 0 erreur / 0 warning sur 114 fichiers ;
  `make dev-design` sert la preview sans aucune étape préalable (4 designs,
  3 jeux de mocks dont un hostile, réordonnancement à la souris). Quatre fautes
  injectées puis retirées, toutes signalées par le compilateur seul : section
  promise oubliée (`Property 'team' is missing`), section ajoutée à une
  assurance (les 2 designs `complete` cassent en nommant `about`), section
  écrite deux fois (`duplicate`), section inventée (`'equipe' does not exist in
  type 'Promised<"complete"> & Optional'`). Rendu SSR sur données hostiles :
  aucun `javascript:`, aucun `data:text/html`, aucun `<script>`, aucune image en
  http, titre hors bornes écarté, avis bornés à 30, ordre corrompu dédupliqué
  et complété, design à ordre fixe ignorant l'ordre stocké.
- Commit lié : "Remplace les layouts par un système de designs à assurances".

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
