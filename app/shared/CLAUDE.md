# Partagé — `app/shared/`

Uniquement du TypeScript **sans interface**, utilisé par au moins deux zones
(un module, une app). Un composant Svelte va dans `ui` ; un code utilisé par
une seule zone reste dans cette zone. Un package `*-db` porte le nom du
schéma qu'il possède.

Modifiable. Un changement ici touche plusieurs zones : garde la compatibilité
(ajouter plutôt que renommer ou supprimer). Des zones qui l'utilisent, tu ne
modifies que celle du lot (cf. racine, « Workflow de session ») : pour les
autres, tu lances leur typecheck et tu signales.

`content-db` et `api-client` sont créés avec leur premier besoin réel, selon
les règles ci-dessous.

## Dépendances entre packages partagés

`auth`, `email` et `api-client` ne dépendent d'aucun autre package partagé.
`pharmacy-db` dépend seulement de `auth` (un compte appartient à des
Tenants). `group-db` dépend de `auth` et de `pharmacy-db`. `billing-db`
dépend de `auth`, `pharmacy-db` et `group-db`. `content-db` dépend seulement
de `engine/schema`. `dev-tools` peut dépendre de tous, et aucun ne dépend de
lui.

## `auth` — les comptes clients (Better Auth)

- Les comptes des Managers et des GroupMembers : la configuration de Better
  Auth (adaptateur Drizzle) et le schéma `auth`, avec ses migrations
  (`src/customer/`). Celle de la Platform n'est pas ici : elle vit dans
  `admin`, construite avec la même boîte à outils (`src/toolkit/`).
- Quatre entrées :
  - `.` : les comptes clients côté serveur (`createCustomerAuthenticationHandle`) ;
  - `./toolkit` : ce qui sert à toute identité (le hook, la connexion à la
    base, `summarizeSignedInUser`) ;
  - `./tables` : les tables de Better Auth, posées dans le schéma voulu (sans
    dépendance à SvelteKit, pour drizzle-kit) ;
  - `./client` : le navigateur (`signInAndOpen`, `registerAndOpen`,
    `signOutAndOpen`, et les messages d'échec en français).
- Un compte a un `firstName`, un `lastName` et un `name` (les deux réunis,
  exigé par Better Auth) : `personNameFields`, commun aux deux identités.
- Les routes de Better Auth (`/api/auth/*`) sont servies par `pharmacy/host`
  et `group`, chacune sur son domaine ; les écrans de connexion sont dans
  `pharmacy/modules/home` et dans `group`.
- Les hooks SvelteKit communs : vérifier la session et remplir `locals.user`,
  rediriger selon la connexion. `auth` ne connaît ni Tenant ni groupement :
  le Tenant actif et les rôles viennent des appartenances, ajoutés par
  `pharmacy-db` (ou `group-db`).
- Pour appeler le C# : un JWT court (plugin `jwt`, `tenantId` dans les
  claims), clés publiques exposées en JWKS interne par `pharmacy/host`.
- Pour l'app mobile : un jeton porteur (plugin `bearer`), vérifié par le même
  hook.

## `pharmacy-db` — la fiche de la pharmacie et ses employés

- Le schéma `pharmacy` (le Tenant, ses coordonnées, ses Employees, les
  appartenances des comptes) et ses migrations.
- Un compte peut appartenir à plusieurs Tenants (un titulaire de plusieurs
  officines) : la session porte le Tenant actif, qu'un sélecteur change.
- Ses fonctions publiques sont **le seul moyen d'écrire** ces tables
  (`addEmployee`, `updatePharmacyContactDetails`…). `home` et `planning` les
  appellent toutes les deux : la règle métier n'existe qu'ici.
- Ses tables sont exportées pour la lecture : une app peut faire une
  jointure dessus, jamais un `insert`, un `update` ni un `delete`.
- Chaque fonction prend le `tenantId` en premier paramètre.

## `group-db` — les groupements

- Le schéma `groups` : les PharmacyGroups et leur quota de pharmacies, leurs
  GroupMembers, l'appartenance des pharmacies, les invitations (des
  pharmacies et des GroupMembers), les actualités du groupement et le choix
  de les imposer à ses pharmacies.
- Un PharmacyGroup est créé par la Platform, jamais par une inscription : son
  premier GroupMember arrive par une invitation envoyée depuis `admin`.
- Une pharmacie appartient à un groupement au plus à la fois. L'appartenance
  garde son historique (`joined_at`, `left_at`), jamais supprimée.
- Ses fonctions sont le seul moyen d'écrire. Le quota s'y vérifie : pharmacies
  membres + invitations en attente ≤ quota.
- Une invitation est nominative (un email), à usage unique, expire, et se
  révoque. Seule l'empreinte de son jeton est stockée. La pharmacie accepte
  explicitement que le groupement voie ses données ; chacun des deux peut y
  mettre fin. La prise en charge court jusqu'à la fin du mois du départ
  (`coverage_ends_at`).
- Lu par `group` (seulement ses pharmacies, RLS sur le `groupId`), `admin`,
  `pharmacy` (savoir à quel groupement on appartient) et, pour le site d'une
  pharmacie membre, `site-manager` et `app/site` (sa fiche, ses modules
  imposés, ses actualités).

## `billing-db` — les abonnements

- Le schéma `billing` : le prix mensuel de chaque Tool et du pack « tous les
  Tools », la grille des forfaits de groupement, les GroupContracts (prise en
  charge Tool par Tool, mode de paiement, facturation), les Subscriptions des
  Tenants, les paiements et les factures.
- Tous les prix sont **hors taxes** (vente entre professionnels) : la TVA
  s'ajoute sur la facture et sur le paiement (`addVat`). Une interface écrit
  toujours « HT » ou « TTC » à côté d'un montant.
- Les Tools sont une liste écrite **une seule fois** (`src/tools/`) ; tout le
  reste (prix, contrats, accès, menu) se déduit de leur `toolKey`. Ajouter un
  Tool = l'ajouter à cette liste, puis lui donner un prix dans `admin`. Un
  Tool sans prix n'est pas encore en vente ; un prix à 0 le rend gratuit pour
  tous.
- Une règle de prix, une seule fonction pure (`src/pricing/`, testée), utilisée
  par le serveur et par le navigateur (l'aperçu en direct) : part de la
  pharmacie = prix × (1 − remise) × (1 − part du groupement). Un Tool est
  accessible si cette part vaut 0 ou si le Tenant y est abonné.
- Un PharmacyGroup paie à l'usage (la somme de ses parts, pharmacie par
  pharmacie) ou au forfait (une offre de la grille, ou sur mesure) : au-delà
  du quota, chaque pharmacie coûte forfait ÷ quota. Une seule fonction pure
  (`computeGroupMonthlyCharge`).
- Le paiement passe par l'interface `PaymentProvider` : le faux prestataire en
  dev (une page de paiement de test), Stripe plus tard, sans autre changement.
- Chaque paiement et chaque renouvellement émet une facture : numérotation
  continue par année, sans trou (`CP-2026-00017`, avoirs compris), client figé
  au moment de l'émission, jamais modifiée ensuite — seul son statut change
  (payée, à régler, remboursée). Un remboursement émet un avoir qui l'annule.
  Les mentions de l'émetteur viennent de l'environnement (`INVOICE_ISSUER_*`).
- Renouvellement : chaque Subscription et chaque GroupContract garde la date
  jusqu'où il est facturé (`billed_until`) ; `runDueBilling` facture ce qui
  est échu (prélevé par carte, ou « à régler » par virement). En dev, l'outil
  de dev le lance (« Passer au mois suivant ») ; en prod, une tâche planifiée.
- Satisfait ou remboursé : une Subscription résiliée dans ses 30 premiers
  jours est remboursée.

## `email` — les emails

- `sendEmail` : par Resend quand `RESEND_API_KEY` existe ; sinon, l'email est
  rangé dans la boîte de dev (un fichier hors du dépôt), lue par l'outil de dev.
- Jamais de donnée de santé dans un email.

## `dev-tools` — l'outil de dev

- Les comptes de démo (un par parcours à tester), leur création par les
  fonctions des propriétaires (jamais d'`insert` direct dans un schéma qui
  n'est pas à lui), leur réinitialisation, et la lecture de la boîte de dev.
- Mot de passe commun des comptes de démo : `demo-crystal-pharm`. Leurs emails
  finissent par `@demo.crystal-pharm.test` : une réinitialisation ne touche
  qu'eux.
- Monté par `pharmacy/host`, `group` et `admin` sous `/__dev/` (404 hors dev),
  chargé par un `import()` dans un `if (import.meta.env.DEV)` : remplacé au
  build, il retire l'outil du build de prod (`dev` de `$app/environment` ne
  suffit pas). Le panneau est `DeveloperToolbar` de `ui`.
- Un parcours nouveau ajoute son compte de démo ici, dans la même branche.

## `api-client` — généré

Produit par `make gen-types`. **Jamais édité à la main** : un type faux se
corrige dans le C#, puis on régénère.

## `content-db` — le schéma `content`

- Le schéma Drizzle `content` et ses migrations (le seul endroit où elles
  vivent).
- Les fonctions de lecture du `TenantSite`, validé par `engine/schema`.
  Les écritures vivent dans `site-manager`.
- Les règles du site affiché (`./domain`, fonctions pures, testées) : quels
  modules s'affichent, imposés ou non, avec ou sans données. `app/site` et
  l'aperçu de `site-manager` les appliquent à leurs propres sources : écrites
  une seule fois, l'aperçu montre le site en ligne.
- Le jeton signé des images de l'aperçu (`./preview-media`), émis par
  `site-manager` et vérifié par `app/site`, avec `SITE_PREVIEW_MEDIA_SECRET`.
- Les adresses des sites (`site_subdomains`) : une adresse actuelle par
  Tenant, les anciennes gardées pour la redirection et réservées à leur
  Tenant. La passerelle trouve un site par son adresse avec
  `runAsSiteGateway` (la RLS ne montre que l'adresse demandée) ; les
  écritures vivent dans `site-manager`.
- Chaque requête passe par la Row-Level Security (cf. racine, « Base de
  données »).
- Les infos de la pharmacie ne sont pas ici : `app/site` les lit dans
  `pharmacy-db`.
