# `site` — les sites publics (SolidStart)

Sert les sites de tous les tenants, et l'aperçu de `site-manager`. L'app
elle-même est créée à l'étape 2 de `app/engine/docs/prochaines-etapes.md`.

## Rendu

- Le Tenant se déduit du seul Host de la requête, résolu en base (premier
  aller-retour : `content.find_site_of_subdomain` composée avec
  `billing.read_tool_access`). Tout en-tête `X-Tenant-Id` venu du
  navigateur est ignoré. Le `tenantId` ne quitte pas le serveur : le moteur ne voit
  **jamais** un nom de domaine.
- Il lit le site dans `content` via `shared/content-db`, la fiche de la
  pharmacie (nom, adresse, téléphone) dans `shared/pharmacy-db`, et son
  groupement (fiche, modules imposés, actualités) dans `shared/group-db`. Un
  adapter les assemble en `TenantSite`, selon les règles du site affiché de
  `shared/content-db` (les mêmes que l'aperçu).
- Il ne rend rien lui-même : il appelle `createTenantSitePage` du moteur et
  affiche la page obtenue. Une seule route attrape-tout pour les pages ; à
  côté, seulement des routes techniques préfixées `__` : `__media/*` (les
  images) et `__preview` (dont ses images, `__preview/media/*`).
- `app/site` répond lui-même quand il n'y a pas de page : 404 « site
  introuvable » (adresse inconnue), 503 « site indisponible » (Tool `site`
  inactif), 301 vers l'adresse actuelle (un chemin `//` revient à l'accueil).
  Aucun log de l'adresse ni du chemin.
- Une page non cachée coûte deux allers-retours Postgres, en une instruction
  chacun, sans BEGIN/COMMIT : l'adresse et le droit, puis le contenu, la
  fiche, l'équipe et le groupement en parallèle (une fonction SQL par
  propriétaire, cf. `app/shared/CLAUDE.md`).
- Le cache est en mémoire, propre à chaque instance, borné (nombre d'entrées
  et octets, LRU). Sa clé est « adresse + chemin » ; chaque entrée retient son
  `tenantId` et le `groupId` affiché. Seule une réponse 200 en `GET` se garde :
  jamais `/__preview`, `/__media`, `/api`, ni rien venu d'un envoi du Visitor.
- Il est vidé par Postgres : chaque table affichée notifie `tenant_site_changed`
  (`tenant:<uuid>` ou `group:<uuid>`) après COMMIT. Chaque instance tient une
  connexion LISTEN dédiée, **jamais derrière pgbouncer en mode transaction**
  (la session de l'écoute n'y survit pas) ; à chaque (re)connexion tout le cache
  est vidé, et tant qu'elle n'est pas établie rien n'est gardé.
- Une page expire au plus tôt de : la fin de l'accès au Tool `site`, la
  prochaine ouverture ou fermeture de la pharmacie, 1 h.
- Le navigateur ne garde rien de partagé : `Cache-Control: private, max-age=0`
  pour une page, `no-store` pour le reste.
- Il n'écrit jamais dans `content`.
- Il compte les pages vues (`shared/site-traffic-db`) : seulement une page
  trouvée, rendue ou rejouée du cache, ni robot ni préchargement ; une vue
  arrivée d'ailleurs que du site commence une visite. Additionnées en
  mémoire, écrites toutes les 30 s, jamais loguées.

## L'aperçu (`/__preview`)

- Les données en cours d'édition arrivent de `site-manager` par
  `postMessage` : origine vérifiée, contenu validé par `engine/schema`,
  tout le reste refusé.
- En aperçu, le moteur reçoit des adapters **sans effet** et aucun ticket :
  rien ne part jamais vers le C#.
- `frame-ancestors` limité au domaine des outils ; `/__preview` n'est jamais
  servi sur le domaine d'un tenant.
- Ses images passent par `/__preview/media/<jeton>` : un jeton signé et
  daté par `site-manager` (cf. `shared/content-db`), jamais un identifiant
  brut.

## Envois du Visitor (by design, dès le premier formulaire)

- Le serveur ne fait qu'une chose : signer le **ticket du Visitor**
  (`tenantId` résolu du Host, type de formulaire, ≤ 10 min) par sa clé
  privée, sur une route du même domaine que la page, limitée en débit par
  IP. Jamais dans le HTML rendu (une page en cache garderait un ticket
  expiré) : le formulaire le demande juste avant l'envoi.
- Les fonctions d'envoi données au moteur (`submitPrescription`…) sont des
  adapters qui tournent dans le navigateur : formulaire validé → ticket →
  appel au C# (`API_URL`, `shared/api-client`). Les créneaux libres se lisent
  de même.
- Un fichier : le navigateur annonce l'envoi au C#, dépose chaque fichier par
  le lien pré-signé reçu, puis confirme.
- Une clé d'idempotence par envoi (un double clic ne crée pas deux envois) et
  un champ piège anti-robot, vérifiés par le C#.
- Rien de ce que le Visitor envoie ne passe par le serveur `site`.
