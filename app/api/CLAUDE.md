# L'API C# — `app/api/`

Une seule API (.NET), découpée en modules : `Identity`, `Planning`,
`Booking`, `Prescriptions`.

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
- Un module ne référence que le `Contracts` d'un autre module, jamais ses
  autres projets. Seul sens autorisé entre modules métier :
  `Booking → Planning.Contracts` (les disponibilités). Jamais l'inverse.
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
  sources exclusives** : le JWT d'un Manager, ou l'identité de service de
  `site` (qui transmet le `tenantId` de la passerelle).
- Les endpoints du Visitor sont dans leurs propres controllers et
  **exigent** l'identité de service `site`. Un JWT de Manager y est refusé,
  et inversement.

## Base de données

- Une `DbContext` par module = un schéma, avec sa propre chaîne de connexion
  (`booking` et `prescriptions` pointent vers l'instance HDS en prod).
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
  - `booking`, `prescriptions` : en plus, la RLS de la racine, le tenant posé
    par un intercepteur EF au début de chaque transaction.
- Concurrence des rendez-vous : une double réservation est rendue impossible
  par la base (contrainte d'exclusion), pas seulement par le code.

## Données de santé

- Stockage derrière des interfaces d'`Application` (ex. `IPrescriptionStore`) :
  local en dev, HDS en prod, choisi par la configuration.
- Chaque lecture d'une donnée de santé laisse une trace (qui, quand, quoi).
- `EnableSensitiveDataLogging` interdit ; page d'exception détaillée en dev
  seulement ; les erreurs renvoyées ne contiennent jamais le contenu reçu.

## Envois du Visitor (by design, dès le premier endpoint)

- Taille maximale fixée, type de fichier vérifié par son contenu (pas par
  l'extension), passage par un `IMalwareScanner` (sans effet en dev).
- Idempotence : `site` envoie une clé unique par envoi ; la même clé renvoie
  le même résultat, jamais un doublon.
- Limite de débit par tenant.

## Auth (by design, dès le premier login)

- Identity émet un access token court (≤ 15 min, RS256) et un refresh token.
- `kid` dans chaque token ; clés publiques exposées en JWKS interne ; `iss`
  et `aud` posés et vérifiés.
- Révocation : à chaque appel, le C# revérifie la version de session de
  l'utilisateur (security stamp). Un compte désactivé perd l'accès tout de suite.

## Règles de code

- API en **Controllers**, jamais de Minimal API.
- Jamais d'entité dans une réponse : toujours un DTO. Contrat modifié ⇒
  signaler qu'il faut lancer `make gen-types`.
- Nullable activé, jamais de `!` sans commentaire. Retours des méthodes
  publiques typés. File-scoped namespaces.
- Pas de Mediator, CQRS ni repository générique sans nécessité démontrée.
- Secrets et connection strings : jamais dans `appsettings*.json`, toujours
  via l'environnement (`ConnectionStrings__Booking`, `Jwt__PrivateKey`…).
- Vérification : `dotnet build app/api` ; `dotnet test` si tu as touché à
  `Domain` ; un test d'intégration sur un vrai Postgres (Testcontainers) pour
  l'isolation entre tenants (« A ne lit pas B »), la concurrence (« deux
  réservations, une seule passe ») et l'auth.
