# Crystal Pharm

SaaS multi-tenant pour pharmacies : le site public de chaque pharmacie, les
outils du pharmacien, l'espace des groupements et l'administration. L'architecture et les règles sont dans
[`CLAUDE.md`](CLAUDE.md).

## Documentation

Chaque zone garde sa doc dans son propre dossier `docs/`.

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
cp .env.example .env                  # une fois, puis adapter
make start                            # Postgres et la passerelle Caddy (les sites et l'aperçu)
make migrate                          # les migrations Drizzle (auth, platform_auth)
make api                              # l'API C#, dans son propre terminal
cd app && pnpm install                # les dépendances JS
pnpm dev                              # les trois apps Svelte et les sites publics
```

| Déployable | Port de dev | Contenu |
|---|---|---|
| `pharmacy/host` | 5173 | les outils des pharmacies : `/login`, `/register`, `/`, `/site-manager`, `/planning`, `/booking`, `/prescriptions` |
| `group` | 5174 | l'espace des groupements : http://groupement.localhost:5174 |
| `admin` | 5175 | l'administration Platform : http://admin.localhost:5175 |
| `app/site` | 5177, derrière Caddy sur 8080 | les sites publics : http://<tenantId>.site.localhost:8080 ; l'aperçu de site-manager : http://apercu.localhost:8080/__preview |
| API C# | 5158 | `Booking`, `Prescriptions` |

`pnpm check` dans `app/` vérifie les types de tout le workspace.
