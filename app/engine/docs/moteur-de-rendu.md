# Le moteur de rendu

Le moteur (`engine/renderer`) transforme les données d'une pharmacie en la page de son site, sous la
forme d'un composant Solid. Il ne contient **aucun layout** (ils vivent dans `engine/layouts` et lui
sont donnés en paramètre) et **aucune plomberie** : ni document HTML, ni build, ni hydratation, ni
`fetch`. C'est l'app qui le consomme (`app/site`, et le banc d'essai en dev) qui s'en charge. Les
diagrammes détaillés sont dans [fonctionnement-complet.md](fonctionnement-complet.md).

## En une phrase

```ts
createTenantSitePage({
  tenantSite,        // les données du site, déjà validées par TenantSiteSchema
  requestedPath,     // '/ordonnance'
  renderedAt,        // l'instant du rendu serveur, repris tel quel par le navigateur
  layouts,           // le registre des layouts (layoutRegistry de @crystal-pharm/layouts)
  sendPrescription,  // l'envoi d'une ordonnance déjà validée, fourni par l'app
}): { status: 'notFound' } | { status: 'found'; title: string; Page: Component }
```

Une fonction pure : même résultat à données égales. `'notFound'` permet à l'app d'envoyer un 404 avant
de rendre. `title` (« Envoyer une ordonnance · Pharmacie Dupont ») va dans le `<title>` de l'app.
`Page` est la page complète (layout, réglages, modules activés, mentions légales) : l'app la rend en
HTML sur le serveur (`<result.Page />`), puis rappelle la même fonction, avec les mêmes données et le
même `renderedAt`, dans le navigateur pour hydrater.

Le moteur ne sait rien du reste : ni du tenant ou du domaine, ni de l'API, ni du système de fichiers,
ni des variables d'environnement, ni des layouts qui existent.

## Qui fait quoi

```
engine/schema      le contrat des données d'un site (Valibot)
engine/renderer    le moteur : sait rendre n'importe quelle valeur de type PharmacySiteLayout
engine/layouts     les layouts, du simple code source sans build
                   + layoutRegistry.ts : les découvre à partir des dossiers
                   + l'export /manifest : ce que l'édition d'un site doit savoir de chaque layout
engine/playground  le banc d'essai : compile l'aperçu, rend le HTML, hydrate (cf. banc-d-essai.md)
app/site           l'app SolidStart qui sert les sites, et l'aperçu de site-manager
```

Les dépendances : `layouts → renderer → schema`. Le moteur ne dépend d'aucun layout.

## Ranger le code du moteur dans sa tête

```
engine/renderer/src/
├─ index.ts                  ce que le moteur expose, à l'app et aux auteurs de layouts
├─ createTenantSitePage.tsx  ← le point d'entrée : layout → page → props des modules → pageKit → Page
│
├─ contract/                 ce qu'un layout doit respecter : PharmacySiteLayout, definePage, Part, LayoutPageProps
├─ layout-registry/          createLayoutRegistry : des fichiers trouvés par Vite aux layouts utilisables
├─ module-props/             données de l'API → props de chaque module (toXxxModuleProps)
├─ page-kit/                 Page, LegalNotice, Module : les seuls outils fournis aux pages
└─ prescription/             validatePrescriptionForm + createSubmitPrescription (valide, puis appelle sendPrescription)
```

## La recette, étape par étape

En partant de `createTenantSitePage` et en faisant Ctrl+clic :

1. **Choisir le layout.** `layouts.findLayoutById(tenantSite.layoutId)`. Un identifiant inconnu lève
   une erreur qui liste les layouts disponibles.
2. **Trouver la page.** `layout.findPage(requestedPath)` cherche le fichier de page correspondant.
   Rien trouvé : `{ status: 'notFound' }`, et l'app affiche sa propre page 404.
3. **Préparer ce que reçoit la page.**
   - `createSubmitPrescription(sendPrescription)` fabrique la fonction d'envoi des layouts : elle
     valide le formulaire, puis passe la demande validée à la fonction de l'app ;
   - `toEnabledModulesProps(modules, { renderedAt, submitPrescription })` calcule les props de chaque
     module activé ;
   - `createPageKit(…)` fabrique `Page`, `LegalNotice` et `Module`.
4. **Fabriquer la page.** `Page` enveloppe la page dans `<div class="layout-<id>">` ;
   `page.render(…)` valide les réglages avec le schéma du layout, puis appelle le composant de page.

## Ce que fait l'app autour

- Elle trouve et valide le `TenantSite` (avec `TenantSiteSchema`).
- Elle fige `renderedAt` sur le serveur et l'écrit dans la page, avec les données, pour que le
  navigateur affiche exactement les mêmes horaires et la même garde.
- Elle compile le moteur et les layouts pour le serveur et pour le navigateur (avec
  `vite-plugin-solid` en mode SSR), sert le CSS, les polices et le JS.
- Elle fournit `sendPrescription` : dans le navigateur, un `POST` vers sa propre route, qui relaie au
  C# avec le tenant donné par la passerelle. Le tenant n'est jamais dans le formulaire.

## Ce qu'est un layout pour le moteur

Une valeur de type `PharmacySiteLayout<Réglages>` : un schéma de réglages et un composant pour chacun
des 8 modules et des 4 sections fixes. Le moteur ne sait rendre que ce type. Un layout qui oublie un module ou une section, ou dont un
composant attend de mauvaises props, ne compile pas.

Le layout et ses pages sont trouvés à partir des dossiers de `engine/layouts/src/`, comme le dossier
`routes/` de SvelteKit :

| Fichier | Ce qu'on en déduit |
|---|---|
| `atelier/atelier.ts` exporte un `PharmacySiteLayout` | Un layout `atelier` |
| `atelier/atelierManifest.ts` exporte `atelierManifest` | Son nom, sa description et ses réglages, pour l'édition |
| `atelier/pages/index.tsx` | Sa page `/` |
| `atelier/pages/ordonnance.tsx` | Sa page `/ordonnance` |
| `atelier/pages/equipe/index.tsx` | Sa page `/equipe` (un sous-dossier marche aussi) |

`engine/layouts/src/layoutRegistry.ts` passe à `createLayoutRegistry` le résultat de deux
`import.meta.glob`, puis vérifie que chaque layout a son manifeste. Un fichier de page mal exporté, un
dossier qui a des pages mais pas de `PharmacySiteLayout`, ou un layout sans manifeste provoque une
erreur claire au démarrage. L'app qui importe `@crystal-pharm/layouts` doit donc être construite par
Vite.

## Le manifeste : ce que l'édition sait d'un layout

`@crystal-pharm/layouts/manifest` est du TypeScript pur, sans Solid : c'est ce que lit `site-manager`
(Svelte), et ce que lit le panneau du banc d'essai.

```ts
layoutManifests        // un par layout, triés par identifiant
findLayoutManifest(id) // { layoutId, label, description, settingsSchema, settingsFields }
```

`settingsFields` décrit chaque réglage à partir du schéma Valibot : `text`, `toggle`, `choice` (avec
ses options) ou `json`, son libellé (`v.title`), sa valeur par défaut. Les libellés des options d'une
liste viennent de `v.metadata({ optionLabels })`. Rien n'est déclaré deux fois.

## Ce que le moteur fournit aux layouts

C'est volontairement très peu. Un layout est du code front libre : le moteur ne fait que le **typer**
pour qu'il n'oublie rien. Tout s'importe depuis `@crystal-pharm/renderer`.

| Outil | Ce qu'il fait | Pourquoi il existe |
|---|---|---|
| `PharmacySiteLayout<Réglages>` | Le type que doit avoir chaque layout | Impose les 8 modules, les 4 sections fixes et un schéma de réglages |
| `definePage<Réglages>({ title, component })` | Type une page | Impose un titre et des mentions légales |
| `pageKit.Page({ legalNotice, children })` | Construit la page et y ajoute les mentions légales | Les mentions légales sont obligatoires |
| `pageKit.LegalNotice({ class })` | Rend le bloc des mentions légales | Son contenu est le même partout, seul le style change |
| `<pageKit.Module name="team" />` | Rend le composant du layout pour ce module, ou rien s'il est désactivé | Un module désactivé ne laisse aucune section vide |
| `<pageKit.FixedSection name="hero" />` | Rend une section fixe (`hero`, `findUs`, `onDuty`, `openingHours`) | Une section fixe est toujours affichée |
| `<pageKit.PlacedModules accepts={[…]} />` | Rend les modules activés dans l'ordre de `moduleOrder`, limités à `accepts` | L'ordre appartient à la pharmacie, les zones au layout |
| `submitPrescription(form)` | Valide puis envoie l'ordonnance | Le seul moyen d'atteindre l'API |
| `validatePrescription(form)` | Valide sans envoyer | Pour le formulaire par étapes |

## Les règles à respecter dans le moteur

- **Aucun accès extérieur.** Pas de `process`, pas de `fs`, pas d'URL, pas de `fetch` : tout arrive
  par les paramètres, y compris les layouts et l'envoi de l'ordonnance.
- **Aucun layout.** Le moteur ne connaît que le type `PharmacySiteLayout`.
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
4. Mettre à jour les mocks du banc d'essai.
