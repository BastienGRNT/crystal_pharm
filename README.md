# Crystal Pharm

SaaS multi-tenant pour pharmacies : le site public de chaque pharmacie, les
outils du pharmacien, l'espace des groupements et l'administration. L'architecture et les règles sont dans
[`CLAUDE.md`](CLAUDE.md).

## Documentation

Chaque zone garde sa doc dans son propre dossier `docs/`.

**L'architecture de prod** : [docs/architecture.md](docs/architecture.md) : les serveurs, les
fournisseurs (HDS compris), les réseaux, les sauvegardes et la prod simulée en local

**Le moteur de rendu** (`app/engine/docs/`)

- [Fonctionnement complet](app/engine/docs/fonctionnement-complet.md) : tout le flux en diagrammes, de la requête à l'envoi d'une ordonnance
- [Le moteur de rendu](app/engine/docs/moteur-de-rendu.md) : comment il est organisé et ce qu'il fournit aux layouts
- [Créer un layout](app/engine/docs/creer-un-layout.md) : le guide pas à pas, avec la liste de contrôle
- [Les données de l'API](app/engine/docs/donnees-api.md) : ce qu'un site reçoit, et ce qu'il renvoie
- [Prochaines étapes](app/engine/docs/prochaines-etapes.md) : les décisions prises et le plan du moteur

**Les maquettes** : `docs/maquettes/` de chaque module
(`app/pharmacy/modules/<module>/`) et du moteur (un dossier par layout) ; le
design system dans `app/ui/` (ses tokens : `app/ui/src/tokens/theme.css`).

## Démarrer

```bash
git config core.hooksPath .githooks   # une fois : retire les trailers d'outil des commits
make dev                              # tout : conteneurs, pnpm install, migrations, API C# et apps
```

Les variables, un fichier par VPS, sont dans `env/` : celles du dev (`env/development/`) se lisent
telles quelles, rien à copier. Le détail : [docs/architecture.md](docs/architecture.md).

`make dev` libère d'abord les ports de dev (un serveur resté d'avant garderait son
ancien code), et Ctrl+C arrête tout. Les étapes une à une, si besoin :

```bash
make start                            # les conteneurs : les deux Postgres, les stockages objet, Mailpit, Caddy
(cd app && pnpm install)              # les dépendances JS
make migrate                          # les migrations Drizzle, à relancer après chaque pull
make api                              # l'API C# (rendez-vous), dans son propre terminal
cd app && pnpm dev                    # les trois apps Svelte et les sites publics
```

| Déployable | Port de dev | Contenu |
|---|---|---|
| `pharmacy/host` | 5173 | les outils des pharmacies : `/login`, `/register`, `/`, `/site-manager`, `/planning`, `/booking`, `/prescriptions` |
| `group` | 5174 | l'espace des groupements : http://groupement.localhost:5174 |
| `admin` | 5175 | l'administration Platform : http://admin.localhost:5175 |
| `app/site` | 5177, derrière Caddy sur 8080 | les sites publics : http://<tenantId>.site.localhost:8080 ; l'aperçu de site-manager : http://apercu.localhost:8080/__preview |
| API C# | 5158 | `Booking`, `Prescriptions` |

| Conteneur (`make start`) | Port | Rôle en prod |
|---|---|---|
| `postgres` | 5445 | le Postgres du Node |
| `health-postgres` | 5446 | le Postgres HDS managé (`booking`, `prescriptions`) |
| `object-storage` | 8333 | le stockage objet des fichiers (R2) |
| `health-object-storage` | 8334 | le stockage objet HDS (fichiers des ordonnances, par liens pré-signés) |
| `mailpit` | 8025 (boîte), 1025 (SMTP) | l'envoi d'emails (Scaleway TEM) : tout arrive ici, rien ne part |
| `caddy` | 8080 | la passerelle devant les sites |

`pnpm check` dans `app/` vérifie les types de tout le workspace.

## La prod simulée

```bash
make simulate                         # docker-compose.prod.yml, fournisseurs simulés, chaque serveur borné à sa taille
make simulate-stop
```

Pharmacie sur http://pharmacie.localhost:8090, emails sur http://localhost:8026. Le détail :
[docs/architecture.md](docs/architecture.md).
