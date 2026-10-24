# Le banc d'essai du moteur

`engine/playground` rend les layouts avec de fausses pharmacies et un panneau
de dev tools par-dessus. Il ne sert qu'en développement : il n'a pas de build,
`vite build` refuse de le construire, et aucune app ne le dépend.

## Lancer

Depuis `app/` :

```bash
pnpm --filter @crystal-pharm/playground dev
```

puis `http://localhost:5176`. La commande compile aussi le moteur en continu
(`layouts dev`) : une sauvegarde dans un layout recharge l'aperçu tout seul.

## Ce que l'aperçu rend

- Le moteur **compilé** (`layouts/dist`), comme l'app des sites : le HTML du
  serveur, puis l'hydratation dans le navigateur. Ce qui marche ici marche en
  production.
- Les données passent par `TenantSiteSchema` à chaque rendu : des données
  invalides affichent leurs erreurs au lieu de la page.
- Les sites sont servis sur `site.localhost:5176` (et
  `<layoutId>.layout.localhost:5176` en comparaison) : les liens internes
  marchent comme sur un vrai domaine.
- L'envoi d'ordonnance arrive sur une fausse API, qui valide comme le C# et
  répond ce que le panneau a choisi. Rien n'est gardé : le journal ne montre
  que le type et la taille du fichier.

## Le panneau

| Onglet | Pour |
|---|---|
| Scénario | la pharmacie, le layout, la page, le groupement, la garde, les données extrêmes (sans images, textes longs, listes vides), la réponse à l'envoi d'ordonnance, la largeur, la comparaison des layouts |
| Modules | chaque module comme le mock, activé ou désactivé ; « imposé » quand le groupement l'exige |
| Réglages | les réglages du layout, lus dans son `<id>SettingsSchema.ts` |
| Données | le TenantSite exact envoyé au moteur, modifiable à la main |
| Journal | erreurs et avertissements des aperçus, hydratation incomplète, ordonnances reçues |

Le panneau se déplace par son en-tête et garde tout (scénario, onglet,
position) d'un rechargement à l'autre. Les raccourcis (Alt + D, Alt + ←/→,
Alt + L, Alt + G, Alt + C, Alt + R, Alt + 1…4) sont dans l'onglet Raccourcis.

## Ajouter un cas

- Une pharmacie : un fichier dans `playground/src/server/mocks/tenants/`, ajouté
  à `allMockTenants.ts`. Sa `description` dit ce qu'elle permet de vérifier.
- Un groupement : `playground/src/server/mocks/demoPharmacyGroups.ts`.
- Un layout ou un réglage : rien à faire, ils sont découverts par leurs dossiers.
