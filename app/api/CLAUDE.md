# L'API C# — `app/api/`

Une seule API (.NET), deux modules : `Booking` et `Prescriptions`. Elle ne
gère ni comptes, ni pharmacie, ni planning : c'est le TypeScript (cf. racine,
« Qui fait quoi »). Exposée sur Internet, appelée par les navigateurs, jamais
par une app Node.

## Un hôte, des modules (un projet par module et par couche)

```
app/api/
├─ CrystalPharm.Api/                        l'hôte : Program.cs, Controllers/<Module>/
└─ Modules/<Module>/
   ├─ CrystalPharm.<Module>.Domain/         Entities/, ValueObjects/ — aucune dépendance
   ├─ CrystalPharm.<Module>.Application/    Dtos/, Interfaces/, Services/ — référence Domain seul
   ├─ CrystalPharm.<Module>.Infrastructure/ Persistence/, Repositories/, Services/
   └─ CrystalPharm.<Module>.Contracts/      ce que les autres modules ont le droit d'utiliser
```

- Les dépendances sont des références de projet : le compilateur les fait
  respecter. `Application` ne référence **jamais** `Infrastructure` : elle
  déclare des interfaces, `Infrastructure` les implémente.
- `Booking` et `Prescriptions` ne dépendent pas l'un de l'autre. Un module ne
  référence que le `Contracts` d'un autre, jamais ses autres projets.
- Dans `Infrastructure`, tout est `internal` sauf
  `<Module>ModuleRegistration` (le `Add<Module>Module` appelé par
  `Program.cs`).
- L'hôte référence l'`Application` et l'`Infrastructure` de chaque module ;
  ses controllers n'utilisent que les interfaces d'`Application`.
- `Contracts` et `CrystalPharm.SharedKernel` (le commun : `ITenantOwned`,
  `ITenantContext`…) sont créés avec leur premier usage réel.
- Réglages communs (framework, nullable) : `Directory.Build.props`, jamais
  répétés dans un `.csproj`.

## Qui appelle, pour quel tenant

- Un seul `ITenantContext`, rempli par un middleware à partir de **deux
  preuves exclusives** : le JWT de Better Auth d'un TenantMember, ou le ticket
  d'un Visitor signé par `site`. Le `tenantId` ne vient que de l'une d'elles.
- Chaque endpoint d'un TenantMember exige la Responsibility qui le couvre
  (dans les claims du JWT) : c'est ici qu'elle se vérifie, le navigateur
  n'est pas une barrière.
- Le C# n'émet aucun token et ne connaît aucun compte. Il vérifie le JWT par
  le JWKS public de `pharmacy/host` (`kid`, `iss`, `aud`, mis en cache). Le
  JWT est court (≤ 15 min) : un compte désactivé perd l'accès au plus tard à
  son expiration.
- Le ticket du Visitor : signé par la clé privée de `site`, vérifié par sa
  clé publique (`VisitorTicket__PublicKeys`, plusieurs pour changer de clé
  sans coupure). Il porte le `tenantId`, le type de formulaire
  (`prescription`, `appointment`) et une expiration courte (≤ 10 min) ; un
  ticket d'un type ne vaut pas pour l'autre.
- Les endpoints du Visitor sont dans leurs propres controllers et
  **exigent** un ticket. Un JWT de TenantMember y est refusé, et inversement.

## Exposé sur Internet

- Derrière son propre Caddy (TLS) ; Kestrel n'écoute jamais Internet en
  direct. Il ne fait confiance qu'aux en-têtes `X-Forwarded-*` de ce Caddy.
- CORS : endpoints du TenantMember limités à `PHARMACY_URL` ; endpoints du
  Visitor ouverts (le ticket est la preuve, jamais de cookie ni de
  `credentials`).
- Limites de débit (le rate limiter d'ASP.NET) : par IP et par Tenant sur
  les endpoints du Visitor, par compte sur ceux du TenantMember. Taille des
  corps bornée partout.
- Ni Swagger ni page d'erreur détaillée hors dev ; en-têtes `nosniff`,
  `no-store` sur toute réponse qui porte une donnée de santé.

## Base de données

- Une `DbContext` par module = un schéma (`booking`, `prescriptions`), avec
  sa propre chaîne de connexion, qui pointe vers l'instance HDS en prod.
- L'API se connecte par un rôle ordinaire, soumis à la RLS ; elle migre par le
  propriétaire des schémas (`ConnectionStrings__HealthMigrations`, cf.
  `CrystalPharm.Api/Database`), jamais l'inverse.
- Chaque contexte a sa table d'historique de migrations dans son schéma
  (`MigrationsHistoryTable("__EFMigrationsHistory", "<schéma>")`).
  Migrations au nom explicite.
- Mapping de chaque entité dans sa propre `IEntityTypeConfiguration<T>`,
  appliquées via `ApplyConfigurationsFromAssembly`.
- Multi-tenant : toute entité liée à un tenant implémente `ITenantOwned`.
  - lecture : global query filter, toujours. `IgnoreQueryFilters` est
    interdit ; un besoin réel se discute avant ;
  - écriture : un `SaveChangesInterceptor` pose le `TenantId` depuis
    `ITenantContext` et refuse toute écriture pour un autre tenant. On ne pose
    jamais un `TenantId` à la main ;
  - en plus, la RLS de la racine, le tenant posé par un intercepteur EF au
    début de chaque transaction.

## Les disponibilités (lues, jamais écrites)

- `Booking` lit `planning.staff_availability`, une vue créée et migrée par
  `pharmacy/modules/planning`, par une connexion **en lecture seule** au serveur normal
  (`ConnectionStrings__PlanningReadOnly`).
- Elle est mappée sans clé (`ToView`) et n'est jamais migrée ni écrite côté C#.
  Ses colonnes sont un contrat (cf. racine, « Contrats »).
- Concurrence : une double réservation est rendue impossible par la base de
  `booking` (contrainte d'exclusion). Elle ne garantit pas qu'un créneau
  retiré du planning entre la lecture et l'écriture soit refusé : `Booking`
  relit la disponibilité juste avant d'écrire.

## Données de santé

- Stockage derrière des interfaces d'`Application` (ex.
  `IPrescriptionDocumentStore`) : un stockage objet S3 (SeaweedFS en dev, HDS
  en prod), choisi par la configuration (`PrescriptionStorage__*`).
- Le navigateur n'y dépose que par un lien pré-signé court (PUT, 15 min,
  `Content-Type` signé). Il ne lit jamais le stockage : le C# lit le fichier
  et le renvoie en flux au TenantMember (tracé, `no-store`), sans disque.
  Jamais d'URL publique ni de bucket ouvert ; la clé du C# est limitée à son
  bucket.
- Les emails aux patients partent d'ici (SMTP de TEM, cf. racine), sans
  autre donnée de santé que ce que le message doit dire.
- Chaque lecture d'une donnée de santé laisse une trace (qui, quand, quoi).
  Depuis le CounterAccount, « qui » est le compte comptoir, pas la personne :
  choix assumé.
- `EnableSensitiveDataLogging` interdit ; page d'exception détaillée en dev
  seulement ; les erreurs renvoyées ne contiennent jamais le contenu reçu.

## Envois du Visitor (by design, dès le premier endpoint)

- Taille maximale fixée, type de fichier vérifié par son contenu (pas par
  l'extension), passage par un `IMalwareScanner` (sans effet en dev).
- Un fichier arrive en trois temps, tous par le navigateur avec son ticket :
  il annonce l'envoi (types, tailles), dépose par lien pré-signé, confirme.
  Les vérifications ont lieu à la confirmation ; un envoi non confirmé reste
  invisible et est purgé.
- Idempotence : le navigateur envoie une clé unique par envoi ; la même clé
  renvoie le même résultat, jamais un doublon.
- Anti-robot vérifié ici : champ piège, limites de débit (cf. « Exposé sur
  Internet »).

## Règles de code

- API en **Controllers**, jamais de Minimal API.
- Jamais d'entité dans une réponse : toujours un DTO. Contrat modifié ⇒
  signaler qu'il faut lancer `make gen-types`.
- Nullable activé, jamais de `!` sans commentaire. Retours des méthodes
  publiques typés. File-scoped namespaces.
- Pas de Mediator, CQRS ni repository générique sans nécessité démontrée.
- Les données de démo de santé sont semées par le C# lui-même, en dev
  seulement : jamais par un appel depuis le Node.
- Secrets et connection strings : jamais dans `appsettings*.json`, toujours
  via l'environnement (`ConnectionStrings__Booking`, `ConnectionStrings__PlanningReadOnly`…).
- Vérification : `dotnet build app/api` ; `dotnet test` si tu as touché à
  `Domain` ; un test d'intégration sur un vrai Postgres (Testcontainers) pour
  l'isolation entre tenants (« A ne lit pas B »), la concurrence (« deux
  réservations, une seule passe ») et l'auth.
