# L'architecture de prod

Ce qui tourne où, ce qui part chez quel fournisseur, et comment la simuler en local.
Le déploiement : `docker-compose.prod.yml` (Forge). La simulation : `make simulate`.

## Les serveurs et les fournisseurs

| Où | Taille | Ce qui y tourne ou y vit |
|---|---|---|
| VPS Caddy + Node | 2 vCPU · 2 Go | `caddy`, `pharmacy`, `group`, `admin`, `site`, `migrate` (ponctuel) |
| VPS Postgres du Node | 1 vCPU · 1 Go · 20 Go | `postgres` (tous les schémas hors santé), `backup` |
| VPS C# | 1 vCPU · 1 Go | `api` (`Booking`, `Prescriptions`) |
| Stockage objet (R2…) | — | les fichiers des Tenants : photos, icônes, documents |
| Postgres HDS managé | — | `booking`, `prescriptions`, et rien d'autre |
| Stockage objet HDS | — | les fichiers des ordonnances |
| Scaleway TEM | — | l'envoi des emails, sans rien garder |
| Stockage des sauvegardes | — | la base du Node et les fichiers, chiffrés ; jamais une donnée de santé |

En dev (`make start`) et en simulation (`make simulate`), chaque fournisseur est un conteneur :
SeaweedFS pour les stockages objet, `postgres:16` pour le Postgres HDS, Mailpit pour TEM.

## Les variables : un fichier par VPS

```
env/
├─ development/   web.env · api.env · database.env       lus tels quels en dev, rien à copier
├─ simulation/    les mêmes, + providers.env              lus par `make simulate`
└─ production/    web · api · database (.env.example)     les modèles à renseigner dans Forge
```

Chaque fichier porte les noms que lit son programme (`DATABASE_URL`, `ConnectionStrings__Booking`…) :
le même fichier se lit en dev, en simulation et en prod. Une valeur partagée entre deux VPS
(`SiteService__ApiKey`, le bucket des fichiers) est écrite dans les deux.

En dev, `pnpm dev`, `make migrate` et les tests lisent `web.env`, `make api` lit `api.env`, le
Postgres de `make start` lit `database.env`. Une variable posée dans le shell l'emporte sur le fichier.

En prod, chaque serveur a son `.env`, écrit par Forge. Le serveur de dev porte les trois VPS : son
`.env` est la suite des trois fichiers (une valeur répétée, comme `FILE_STORAGE_BUCKET`, y est
identique). `docker-compose.prod.yml` ne donne à chaque service que ses propres variables.

## Les réseaux

Un réseau compose par lien, comme entre les serveurs :

| Réseau | Qui | Sortie vers Internet |
|---|---|---|
| `gateway` | Caddy, les apps Node | oui : stockage objet, TEM, paiement |
| `node_database` | `postgres`, `migrate`, les apps Node, `backup` | non |
| `api_link` | `pharmacy`, `site`, `api` | non |
| `hds` | `api` seul | oui : Postgres et stockage HDS |
| `backup_outbound` | `backup` seul | oui : stockage des sauvegardes, lecture du stockage objet |

Aucun service Node n'est sur `hds` : une donnée de santé ne peut lui arriver que par le C#.

## Les fichiers des ordonnances : des liens pré-signés

Le fichier va du navigateur au stockage HDS, sans passer par le Node ni par le C#.

1. Le navigateur envoie le formulaire, sans les fichiers, à `site` (`POST /api/prescriptions/uploads`) :
   pour chaque fichier, sa nature, sa taille et son type, lu dans ses premiers octets.
2. `site` le valide et le relaie au C# (identité de service, `tenantId` du Host, clé d'idempotence).
   Le C# crée l'envoi, invisible pour la pharmacie, et renvoie un lien de dépôt par fichier
   (PUT, 15 min, `Content-Type` signé).
3. Le navigateur dépose chaque fichier par son lien.
4. Le navigateur demande à `site` de confirmer (`POST …/uploads/completion`). Le C# relit chaque
   objet : taille, type reconnu par son contenu, scan antivirus. Un fichier différent de l'annonce :
   l'envoi entier est effacé. Un fichier manquant : refus, le navigateur peut réessayer.
   Un envoi jamais confirmé est purgé, fichiers compris, après 30 minutes (à la lecture suivante
   de la liste par la pharmacie).
5. La pharmacie ouvre un fichier : `pharmacy` demande au C# un lien de lecture (GET, 2 min, tracé)
   et y redirige le navigateur, sans `Referer` ni cache.

Le bucket HDS n'est jamais public ni listable ; seule la clé du C#, limitée à ce bucket, y accède.
Son CORS autorise le navigateur à déposer et lire depuis les sites :

```json
[{
  "AllowedOrigins": ["https://*.site.example.fr", "https://pharmacie.example.fr"],
  "AllowedMethods": ["PUT", "GET"],
  "AllowedHeaders": ["content-type"],
  "MaxAgeSeconds": 600
}]
```

## La base de santé : deux rôles

L'API tourne avec `crystal_pharm_api`, un rôle ordinaire, soumis à la Row-Level Security. Elle migre
au démarrage par le propriétaire des schémas (`ConnectionStrings__HealthMigrations`), qui échappe à la RLS.
Chez l'hébergeur HDS, une fois, par le propriétaire (la même chose que
`docker/health-postgres/create-api-role.sh`) :

```sql
create role crystal_pharm_api login password '<mot de passe>' nosuperuser nobypassrls;
create schema if not exists booking;
create schema if not exists prescriptions;
grant usage on schema booking, prescriptions to crystal_pharm_api;
alter default privileges in schema booking, prescriptions
	grant select, insert, update, delete on tables to crystal_pharm_api;
alter default privileges in schema booking, prescriptions
	grant usage, select on sequences to crystal_pharm_api;
```

## Les emails

`shared/email` parle SMTP : à TEM en prod (`SMTP_URL`, TLS exigé), à Mailpit avec
`APP_ENV=development`. Sur le serveur de dev de Forge, `COMPOSE_PROFILES=development-mailbox` lance
Mailpit. Jamais de donnée de santé dans un email.

## Les sauvegardes

Le service `backup` fait, toutes les `BACKUP_INTERVAL_HOURS` heures, un `pg_dump` du Postgres du Node
et une copie du bucket des fichiers, chiffrés par rclone (crypt) avant de partir. Les dumps et les
fichiers remplacés de plus de `BACKUP_RETENTION_DAYS` jours sont effacés. Les données de santé n'y
sont jamais : leur sauvegarde est celle de l'hébergeur HDS.

Restaurer, depuis l'image `backup` (mêmes variables) :

```bash
rclone lsf encrypted:database                                   # les dumps
rclone cat encrypted:database/<date>.dump | pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL"
rclone sync encrypted:files/current "files:$FILE_STORAGE_BUCKET"   # avec une clé en écriture
```

Sans `BACKUP_ENCRYPTION_PASSWORD`, les sauvegardes sont illisibles : il se garde aussi hors du serveur.

## La prod simulée

`make simulate` lance `docker-compose.prod.yml` avec `docker/simulation/compose.yml` : chaque
fournisseur devient un conteneur sur le réseau qui le joint en prod, et chaque service est borné à sa
part de son serveur. Les variables : `env/simulation/`. Elle tourne à côté du dev.

| Adresse | |
|---|---|
| http://pharmacie.localhost:8090 | `pharmacy` |
| http://groupement.localhost:8090 · http://admin.localhost:8090 | `group` · `admin` |
| http://\<adresse\>.site.localhost:8090 | les sites |
| http://localhost:8026 | les emails |
| http://localhost:8335 | le stockage HDS, joint par le navigateur |

## Passer un déploiement existant sur cette architecture

Avant, les fichiers étaient dans les volumes `file_storage` et `prescription_files`, et `booking`,
`prescriptions` dans le Postgres du Node. Une fois, avant de lancer la nouvelle version :

1. Les fichiers des Tenants : `rclone copy <volume file_storage> files:<bucket>` (mêmes chemins).
2. Les fichiers des ordonnances : `rclone copy <volume prescription_files> <stockage HDS>:<bucket>`
   (mêmes chemins).
3. La base de santé : `pg_dump --schema=booking --schema=prescriptions --no-owner` depuis le Postgres
   du Node, restauré dans le Postgres HDS par le propriétaire, puis
   `grant select, insert, update, delete on all tables in schema booking, prescriptions to crystal_pharm_api`.
   Une fois vérifiés, `drop schema booking, prescriptions cascade` dans le Postgres du Node.
