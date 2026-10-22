# Crystal Pharm

SaaS multi-tenant pour pharmacies : le site public de chaque pharmacie, et
les outils du pharmacien. L'architecture et les règles sont dans
[`CLAUDE.md`](CLAUDE.md).

## Documentation

Chaque zone garde sa doc dans son propre dossier `docs/`.

**Le moteur de rendu** (`app/packages/docs/`)

- [Fonctionnement complet](app/packages/docs/fonctionnement-complet.md) : tout le flux en diagrammes, de la requête à l'envoi d'une ordonnance
- [Le moteur de rendu](app/packages/docs/moteur-de-rendu.md) : comment il est organisé et ce qu'il fournit aux layouts
- [Créer un layout](app/packages/docs/creer-un-layout.md) : le guide pas à pas, avec la liste de contrôle
- [Les données de l'API](app/packages/docs/donnees-api.md) : ce qu'un site reçoit, et ce qu'il renvoie
- [Prochaines étapes](app/packages/docs/prochaines-etapes.md) : les décisions prises et le plan du moteur

**Les maquettes** : `docs/maquettes/` de chaque module
(`app/tools/modules/<module>/`) et du moteur (un dossier par layout) ; le
design system des outils dans `app/tools/ui/docs/design-system/`.

## Démarrer

```bash
git config core.hooksPath .githooks   # une fois : retire les trailers d'outil des commits
cp .env.example .env                  # une fois, puis adapter
make start                            # Postgres
make api                              # l'API C#, dans son propre terminal
cd app && pnpm install                # les dépendances JS
pnpm --filter @crystal-pharm/tools dev
```

| Déployable | Port de dev | Contenu |
|---|---|---|
| `tools/host` | 5173 | les outils : `/`, `/site-manager`, `/planning`, `/booking`, `/prescriptions` |
| `app/site` | — | les sites publics (créé à l'étape 2 du moteur) |
| API C# | 5158 | `Booking`, `Prescriptions` |

`pnpm check` dans `app/` vérifie les types de tout le workspace.
