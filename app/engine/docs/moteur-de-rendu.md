# Le moteur de rendu

Le moteur (`packages/renderer`) transforme les données d'une pharmacie en un site complet :
**rapide à l'affichage** (le serveur envoie une page déjà remplie) et **interactif** (Solid reprend la
main dans le navigateur). Il ne contient **aucun layout** : les layouts vivent dans `packages/layouts` et
lui sont donnés en paramètre. Les diagrammes détaillés sont dans
[fonctionnement-complet.md](fonctionnement-complet.md).

## En une phrase

```ts
renderTenantSite(tenantSite: TenantSite, requestedPath: string, layouts: LayoutRegistry): { status: 200 | 404; html: string }
```

Il reçoit des données **déjà validées**, un chemin et les layouts disponibles, il renvoie du HTML. Il
ne sait rien du reste : ni des mocks, ni de la façon dont on a trouvé le tenant, ni du système de
fichiers, ni des variables d'environnement, ni des layouts qui existent.

## Qui fait quoi

```
packages/renderer   le moteur : sait rendre n'importe quelle valeur de type PharmacySiteLayout
packages/layouts    les layouts : chacun est une valeur de type PharmacySiteLayout
                    + layoutRegistry.ts : les découvre à partir des dossiers
                    + la compilation du moteur et des layouts ensemble
apps/simulator      appelle renderTenantSite(tenantSite, chemin, layoutRegistry)
```

Les dépendances : `simulator → layouts → renderer → schema`. Le moteur ne dépend d'aucun layout.

## Les deux compilations

Le moteur et les layouts sont compilés ensemble, deux fois, par `packages/layouts/vite.config.ts` :

| Build | Entrée | Sortie | Utilisé par |
|---|---|---|---|
| Serveur | `src/serverEntry.ts` | `dist/server/serverEntry.js` | Le serveur des sites (ici le simulateur) |
| Navigateur | `src/browserEntry.tsx` | `dist/client/client.js` + `client.css` + polices | Le navigateur, via `/_renderer/…` |

`serverEntry.ts` exporte `renderTenantSite`, `layoutRegistry` et `rendererClientAssetsPath`.
`browserEntry.tsx` appelle `hydrateTenantSite(layoutRegistry)`. Les deux utilisent le même composant
racine, `TenantSiteRoot`, et les mêmes layouts : c'est ce qui garantit que le navigateur retrouve
exactement l'arbre produit par le serveur.

## Ranger le code du moteur dans sa tête

```
packages/renderer/src/
├─ index.ts                  ce que le moteur expose, à l'application et aux auteurs de layouts
├─ renderTenantSite.tsx      ← entrée serveur : layout → page → renderToString → document HTML
├─ hydrateTenantSite.tsx     ← entrée navigateur : relit les données → hydrate
├─ TenantSiteRoot.tsx        ← la racine commune : prépare props, fonctions et pageKit, appelle la page
│
├─ contract/                 ce qu'un layout doit respecter : PharmacySiteLayout, definePage, Part, LayoutPageProps
├─ layout-registry/          createLayoutRegistry : des fichiers trouvés par Vite aux layouts utilisables
├─ module-props/             données de l'API → props de chaque module (toXxxModuleProps)
├─ page-kit/                 Page, LegalNotice, Module : les seuls outils fournis aux pages
├─ prescription/             validatePrescriptionForm + createSubmitPrescription (le seul fetch)
└─ html-document/            la page HTML autour du rendu (l'équivalent de app.html dans SvelteKit)
```

## La recette, étape par étape

En partant de `renderTenantSite` et en faisant Ctrl+clic :

1. **Choisir le layout.** `layouts.findLayoutById(tenantSite.layoutId)`. Un identifiant inconnu lève
   une erreur qui liste les layouts disponibles.
2. **Trouver la page.** `layout.findPage(requestedPath)` cherche le fichier de page correspondant.
   Rien trouvé : statut 404 et page `renderNotFoundDocument`.
3. **Figer l'instant du rendu.** `renderedAt` est enregistré dans `TenantSiteRenderData`, pour que le
   navigateur affiche ensuite exactement les mêmes horaires et la même garde.
4. **Rendre la racine.** `renderToString(() => <TenantSiteRoot renderData={…} layouts={…} />)`. Dans la racine :
   - `createSubmitPrescription({ apiBaseUrl, tenantId })` fabrique la fonction d'envoi ;
   - `toEnabledModulesProps(modules, …)` calcule les props de chaque module activé ;
   - `createPageKit(…)` fabrique `Page`, `LegalNotice` et `Module` ;
   - `page.render(…)` valide les réglages avec le schéma du layout, puis appelle le composant de page.
5. **Envelopper dans un document.** `renderHtmlDocument` ajoute `<title>`, le CSS, le script
   d'hydratation de Solid, les données sérialisées (avec `<` échappé) et la balise `<script>` du
   bundle client.
6. **Dans le navigateur.** `hydrateTenantSite(layouts)` relit les données et appelle
   `hydrate(() => <TenantSiteRoot … />)`. Solid réutilise chaque nœud du HTML et branche les événements.

## Ce qu'est un layout pour le moteur

Une valeur de type `PharmacySiteLayout<Réglages>` : un schéma de réglages et un composant pour chacun
des 6 modules. Le moteur ne sait rendre que ce type. Un layout qui oublie un module, ou dont un
composant attend de mauvaises props, ne compile pas.

Le layout et ses pages sont trouvés à partir des dossiers de `packages/layouts/src/`, comme le dossier
`routes/` de SvelteKit :

| Fichier | Ce qu'on en déduit |
|---|---|
| `atelier/atelier.ts` exporte un `PharmacySiteLayout` | Un layout `atelier` |
| `atelier/pages/index.tsx` | Sa page `/` |
| `atelier/pages/ordonnance.tsx` | Sa page `/ordonnance` |
| `atelier/pages/equipe/index.tsx` | Sa page `/equipe` (un sous-dossier marche aussi) |

`packages/layouts/src/layoutRegistry.ts` passe à `createLayoutRegistry` le résultat de deux
`import.meta.glob`. En mode `pnpm dev`, un petit plugin de `vite.config.ts` relance le build quand un
fichier est créé ou supprimé. Un fichier de page mal exporté, ou un dossier qui a des pages mais pas
de `PharmacySiteLayout`, provoque une erreur claire au démarrage.

## Ce que le moteur fournit aux layouts

C'est volontairement très peu. Un layout est du code front libre : le moteur ne fait que le **typer**
pour qu'il n'oublie rien. Tout s'importe depuis `@crystal-pharm/renderer`.

| Outil | Ce qu'il fait | Pourquoi il existe |
|---|---|---|
| `PharmacySiteLayout<Réglages>` | Le type que doit avoir chaque layout | Impose les 6 modules et un schéma de réglages |
| `definePage<Réglages>({ title, component })` | Type une page | Impose un titre et des mentions légales |
| `pageKit.Page({ legalNotice, children })` | Construit la page et y ajoute les mentions légales | Les mentions légales sont obligatoires |
| `pageKit.LegalNotice({ class })` | Rend le bloc des mentions légales | Son contenu est le même partout, seul le style change |
| `<pageKit.Module name="team" />` | Rend le composant du layout pour ce module, ou rien s'il est désactivé | Un module désactivé ne laisse aucune section vide |
| `submitPrescription(form)` | Valide puis envoie l'ordonnance | Le seul moyen d'atteindre l'API |
| `validatePrescription(form)` | Valide sans envoyer | Pour le formulaire par étapes |

## Les règles à respecter dans le moteur

- **Aucun accès extérieur.** Pas de `process`, pas de `fs`, pas d'URL codée en dur : tout arrive par
  les paramètres, y compris les layouts. Seule exception : `rendererClientAssetsPath` (`/_renderer`),
  l'adresse où le moteur attend ses propres fichiers, partagée avec la config Vite et le serveur.
- **Aucun layout.** Le moteur ne connaît que le type `PharmacySiteLayout`.
- **Un seul `fetch`**, dans `prescription/createSubmitPrescription.ts`.
- **Un seul `as`**, dans `createPart` (`page-kit/createPageKit.tsx`), volontairement non exporté.
- **Rien qui dépende de l'horloge ou du fuseau** dans les composants : on passe par `renderedAt` et
  `formatInParisTimeZone`.

## Ajouter un module

L'ajout de la carte de fidélité a suivi ce chemin, que le compilateur impose étape par étape :

1. `schema` : créer `XxxModuleDataSchema`, l'ajouter à `ModuleNameSchema` et à `TenantModulesSchema`
   (le `satisfies Record<ModuleName, …>` signale l'oubli).
2. `renderer/module-props` : créer `toXxxModuleProps`, l'ajouter à `ModulePropsByName` et à
   `toEnabledModulesProps`, puis exporter son type depuis `index.ts`.
3. **Tous les layouts cessent de compiler** (`Property 'xxx' is missing in type … PharmacySiteLayout`)
   jusqu'à ce qu'ils aient leur composant pour ce module et le placent sur une page avec
   `<pageKit.Module name="xxx" />`.
4. Mettre à jour les mocks.

## Passer à SolidStart plus tard

Le moteur exporte déjà `TenantSiteRoot`. Une app SolidStart aurait une route attrape-tout qui appelle
l'API puis affiche `<TenantSiteRoot renderData={…} layouts={layoutRegistry} />`. SolidStart remplacerait
alors `html-document/`, `hydrateTenantSite.tsx` et la config de build. Les layouts, le contrat et le
schéma ne changeraient pas.
