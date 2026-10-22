# Prochaine session : où on en est, ce qu'on a décidé, ce qu'on fait ensuite

Ce fichier sert de point de départ à la prochaine session de travail. Lis-le en entier, puis lis
`README.md` et les autres fichiers de ce dossier avant de proposer quoi que ce soit.

## Où on en est

Le prototype fonctionne de bout en bout (`pnpm dev`, puis http://localhost:3000/) :

```
packages/
├─ schema/     le contrat des données (Valibot), aucune dépendance à Solid
├─ renderer/   le moteur : type PharmacySiteLayout, definePage, pageKit, module-props,
│              validation et envoi de l'ordonnance, TenantSiteRoot… et encore la plomberie
│              (renderTenantSite, hydrateTenantSite, html-document/)
└─ layouts/    essential, neighborhood, atelier : chacun est une valeur de type PharmacySiteLayout
               + layoutRegistry.ts (découverte par dossiers) + la config Vite qui compile tout
apps/
└─ simulator/  serveur Hono : trouve le tenant ET appelle le rendu, mocks, faux endpoint d'ordonnance
```

- Un layout est une **valeur typée** `PharmacySiteLayout<Réglages>` : un schéma de réglages et un
  composant par module. Un module oublié ne compile pas.
- Son identifiant est le nom de son dossier. Ses pages sont les fichiers de `pages/`
  (`index.tsx` → `/`, `ordonnance.tsx` → `/ordonnance`), typés par `definePage`.
- Le moteur ne connaît aucun layout : il reçoit un `LayoutRegistry` en paramètre.
- 6 modules : `openingHours`, `team`, `services`, `news`, `prescriptionUpload`, `loyaltyCard`.
- Un groupement peut imposer des modules (`pharmacy.group.mandatoryModules`), vérifié par le schéma.

## Les règles du projet (à respecter dans tout ce qui suit)

- **Pas de form builder, pas de kit qui rend de l'interface.** Un layout est du code front libre ; le
  moteur ne fait que le **typer** pour qu'il n'oublie rien, et lui donne des fonctions typées
  (`submitPrescription`, `validatePrescription`).
- **Moins on déclare, moins on oublie.** Préférer la découverte par dossiers et les types aux listes
  écrites à la main. Garder une déclaration seulement quand elle apporte une garantie à la compilation.
- Le moteur, c'est **la logique** : pas de plomberie de serveur, pas d'accès extérieur, aucun layout.
- Tout reste typé de bout en bout, et `pnpm check` doit passer.
- Identifiants en anglais, textes affichés en français, noms longs et explicites, un fichier = une chose.
- Travailler par étapes et s'arrêter à la fin de chacune pour validation.

## Les décisions prises

### 1. L'architecture cible : trois rôles séparés

```
navigateur ──▶ pharmacie-dupont.fr
                    │
                    ▼
        ┌───────────────────────┐
        │  Passerelle           │  nom de domaine → tenantId
        │  (proxy / edge)       │  certificats HTTPS, redirections, cache des pages
        └───────────────────────┘
                    │  GET /ordonnance   +   tenantId: pharmacie-dupont
                    ▼
        ┌───────────────────────┐
        │  App de rendu         │  tenantId → API → TenantSite (en cache)
        │  (SolidStart)         │  → <TenantSiteRoot /> → HTML + hydratation
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Moteur (renderer)    │  données → layout → page
        └───────────────────────┘
```

| Rôle | Il connaît | Il ne connaît pas |
|---|---|---|
| **Passerelle** | Les noms de domaine et le tenant qui correspond à chacun | Les layouts, le rendu |
| **App de rendu** | Un `tenantId`, l'API, le cache | Les noms de domaine |
| **Moteur** | Les données d'un site et les layouts | Le tenant, le domaine, l'API |

**L'app qui trouve le tenant par le nom de domaine n'est pas celle qui génère la page.** Pourquoi :

- l'aperçu de l'admin n'a pas le nom de domaine de la pharmacie : il appelle directement l'app de
  rendu avec un `tenantId`, comme la passerelle, sans cas particulier ;
- les domaines personnalisés (ajout, certificats, redirections) se gèrent à un seul endroit ;
- l'app de rendu reste simple et peut tourner en plusieurs exemplaires ;
- le cache peut se faire à deux niveaux : pages entières dans la passerelle, données de l'API dans
  l'app de rendu.

### 2. L'app de rendu sera une app SolidStart

```
apps/
└─ site/                         l'app SolidStart qui sert tous les sites
   └─ src/routes/[...path].tsx   une seule route attrape-tout
packages/
├─ schema/  renderer/  layouts/  l'app les importe
```

SolidStart prend en charge le document HTML, l'hydratation, la compilation et le cache : exactement
la plomberie qu'on veut sortir du moteur. Le moteur exporte déjà `TenantSiteRoot`, le seul point de
rencontre.

### 3. L'aperçu dans l'admin (l'admin sera en Svelte)

Svelte ne peut pas afficher des composants Solid : l'admin ne rend donc pas les sites lui-même. Deux
options retenues, à départager le moment venu :

- **c. Une iframe vers l'app SolidStart (recommandée).**
  `admin Svelte ── postMessage(données en cours) ──▶ <iframe src="site/__preview"> ──▶ <TenantSiteRoot />`.
  Isolation totale (CSS, JS, navigation), vrai aperçu mobile (une iframe de 390 px déclenche le CSS
  mobile), même code qu'en production, mise à jour en direct. C'est la méthode de Shopify et Webflow.
- **b. Solid monte le site dans un `div` fourni par Svelte.**
  `mountSitePreview(element, tenantSiteEnCoursDeModification)`, un Shadow DOM pour isoler le CSS. Mise à
  jour fine à chaque modification, mais les éléments fixes ou collants (la colonne latérale d'`atelier`),
  les tailles en `vh` et l'aperçu mobile posent problème, car le CSS regarde la fenêtre de l'admin.

Écartée : insérer le HTML rendu avec `{@html}` dans un `<div id="solid_rendu">` (le CSS fuit dans les
deux sens, la mise en page casse, pas d'aperçu mobile, les liens font naviguer l'admin).

### 4. Le thème personnalisable, en restant typé

Les couleurs et polices passent déjà par des variables CSS. Chaque layout déclarera dans son schéma
de réglages **ce qu'il accepte de personnaliser**, avec des valeurs par défaut :

```ts
theme: v.object({
  primaryColor: v.optional(hexColor, '#1f6b45'),
  headingFont: v.optional(v.picklist(['Fraunces', 'Lora']), 'Fraunces'),
})
```

Le moteur les transforme en variables CSS. Une couleur invalide est refusée à la validation, chaque
layout ne propose que ce qu'il sait afficher proprement (par exemple une liste de polices fermée), et
les composants ne changent pas.

### 5. L'ordre des modules : le layout définit des zones, la pharmacie choisit l'ordre

La pharmacie ne doit pas pouvoir casser la mise en page. Le partage des rôles :

- **le layout** définit des **zones** (par exemple « contenu principal ») et les modules qu'il accepte
  d'y placer. Il continue de décider **où** les modules peuvent aller ;
- **la pharmacie** choisit **dans quel ordre** ils apparaissent à l'intérieur d'une zone, par une
  donnée de l'API :

```ts
moduleOrder: ['news', 'openingHours', 'team']
```

Ça reste typé de bout en bout : les noms viennent de `ModuleNameSchema`, donc une faute de frappe ou un
doublon est refusé à la validation. Un module désactivé est simplement ignoré, un module accepté par la
zone mais absent de la liste prend sa place par défaut.

Questions à trancher avant de coder :

- un ordre par zone, ou un seul ordre pour tout le site, que chaque zone filtre ?
- un ordre par page, ou commun à toutes les pages ?
- côté layout, quelle forme pour une zone : un composant fourni par le `pageKit`
  (`<pageKit.ModuleZone name="main" accepts={['news', 'team', 'services']} />`), ou une déclaration typée
  dans le `PharmacySiteLayout` pour que l'admin connaisse les zones sans rendre la page ?
- le type doit empêcher un layout de placer deux fois le même module dans deux zones.

## Le plan pour la suite, dans cet ordre

1. **Sortir la plomberie du moteur.** `renderTenantSite.tsx`, `hydrateTenantSite.tsx`, `html-document/`
   et la config Vite vont dans l'app de rendu (le simulateur pour l'instant). `packages/renderer` ne
   garde que la logique : contrat, module-props, `pageKit`, ordonnance, registre des layouts et
   `TenantSiteRoot`. `packages/layouts` redevient du simple code source, sans build.

   **Objectif : un moteur pur à 100 %.** Il ne produit ni HTML, ni JS, ni CSS : il fournit la
   description de la page (`TenantSiteRoot`, un arbre de composants Solid), à partir des données, des
   layouts et de l'instant du rendu. Il ne sait ni qui l'appelle, ni pour quel tenant, ni où il tourne.
   C'est l'app qui le consomme qui trouve les données, rend le HTML, sert le JS et le CSS, et hydrate.

   **Le seul point d'entrée du moteur** remplacera `renderTenantSite` (qui renvoie du HTML) et
   `TenantSiteRoot` :

   ```ts
   createTenantSitePage({
     tenantSite,          // les données du site, déjà validées par TenantSiteSchema
     requestedPath,       // '/ordonnance'
     renderedAt,          // l'instant du rendu, pour les horaires et la garde
     layouts,             // le registre des layouts disponibles
     submitPrescription,  // la fonction d'envoi de l'ordonnance, fournie par l'app
   }):
     | { status: 'notFound' }
     | { status: 'found'; title: string; Page: Component }
   ```

   Une fonction pure : aucun effet, même résultat à données égales. `'notFound'` permet à l'app
   d'envoyer un 404 avant de rendre. `title` (« Envoyer une ordonnance · Pharmacie Dupont ») va dans le
   `<title>` de l'app. `Page` est un composant Solid, pas du HTML : la page complète (layout, réglages,
   modules activés, mentions légales). L'app l'affiche avec `<result.Page />` ; SolidStart le rend en
   HTML côté serveur, puis rappelle la même fonction dans le navigateur pour hydrater.

   Le nom `createTenantSitePage` suit la convention de Solid (`createSignal`…) : la fonction **fabrique**
   le composant de la page, elle ne le dessine pas. Éviter `render…` (dans Solid, `render` veut dire
   dessiner pour de vrai) et `Show…` (`<Show>` est déjà un composant de Solid). Côté SolidStart, la
   route attrape-tout s'appelle `TenantSiteRoute` :

   ```tsx
   // apps/site/src/routes/[...path].tsx
   export default function TenantSiteRoute() {
     const result = createTenantSitePage({ … });
     if (result.status === 'notFound') return <NotFound />;
     return (
       <>
         <Title>{result.title}</Title>
         <result.Page />
       </>
     );
   }
   ```

   Pour cela, retirer aussi le dernier `fetch` du moteur : l'app fournit elle-même la fonction d'envoi
   de l'ordonnance (`<TenantSiteRoot … submitPrescription={(form) => …} />`). Le moteur garde la
   validation (`validatePrescriptionForm`), qui est de la logique pure, et transmet la fonction aux
   layouts, qui ne voient aucune différence.
2. **Remplacer le simulateur par la vraie app SolidStart** (`apps/site`), avec du cache, et séparer
   tout de suite les rôles :
   - l'app reçoit un `tenantId` (en-tête ou préfixe de chemin : à choisir ensemble) et ne voit jamais
     de nom de domaine ;
   - un petit simulateur de passerelle fait la conversion « domaine → tenantId » en développement ;
   - une route d'aperçu `/__preview` prête pour l'iframe de l'admin (données reçues par `postMessage`).
3. **Ajouter le thème personnalisable** (section 4).
4. **Ajouter l'ordre des modules** (section 5), après avoir tranché les questions.

## Pistes notées, non prioritaires

- La règle « carte de fidélité seulement avec un groupement » dans le schéma.
- Les tests.
- L'admin.
