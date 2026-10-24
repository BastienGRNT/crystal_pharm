# Prochaine session : où on en est, ce qu'on a décidé, ce qu'on fait ensuite

Ce fichier sert de point de départ à la prochaine session de travail. Lis-le en entier, puis lis
`README.md` et les autres fichiers de ce dossier avant de proposer quoi que ce soit.

## Où on en est

Le moteur est pur, et le banc d'essai le fait tourner (`pnpm --filter @crystal-pharm/playground dev`) :

```
engine/
├─ schema/      le contrat des données (Valibot), aucune dépendance à Solid
├─ renderer/    le moteur : createTenantSitePage, type PharmacySiteLayout, definePage, pageKit,
│               module-props, validation de l'ordonnance. Ni HTML, ni build, ni fetch.
├─ layouts/     essential, neighborhood, atelier : chacun est une valeur de type PharmacySiteLayout
│               + layoutRegistry.ts (découverte par dossiers) + l'export /manifest (sans Solid)
└─ playground/  le banc d'essai : compile l'aperçu, rend le HTML, hydrate, mocks, fausse API
```

- Un layout est une **valeur typée** `PharmacySiteLayout<Réglages>` : un schéma de réglages et un
  composant par module. Un module oublié ne compile pas.
- Son identifiant est le nom de son dossier. Ses pages sont les fichiers de `pages/`
  (`index.tsx` → `/`, `ordonnance.tsx` → `/ordonnance`), typés par `definePage`. Son manifeste
  (`<id>Manifest.ts`) donne son nom, sa description et ses réglages à l'édition.
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
- Tout reste typé de bout en bout, et le `check` de chaque package doit passer.
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
        │  App de rendu         │  tenantId → bases → TenantSite (en cache)
        │  (SolidStart)         │  → createTenantSitePage → HTML + hydratation
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
| **App de rendu** | Un `tenantId`, les bases, l'API, le cache | Les noms de domaine |
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
app/site/                        l'app SolidStart qui sert tous les sites
└─ src/routes/[...path].tsx      une seule route attrape-tout
app/engine/
├─ schema/  renderer/  layouts/  l'app les importe
```

SolidStart prend en charge le document HTML, l'hydratation, la compilation et le cache : la plomberie
sortie du moteur. `createTenantSitePage` est le seul point de rencontre :

```tsx
// app/site/src/routes/[...path].tsx
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

### 3. L'aperçu dans `site-manager` (en Svelte) : une iframe

Svelte ne peut pas afficher des composants Solid : `site-manager` ne rend donc pas les sites lui-même.

`site-manager ── postMessage(données en cours) ──▶ <iframe src="site/__preview"> ──▶ createTenantSitePage`.

Isolation totale (CSS, JS, navigation), vrai aperçu mobile (une iframe de 390 px déclenche le CSS
mobile), même code qu'en production, mise à jour en direct. C'est la méthode de Shopify et Webflow.

Écartés : monter Solid dans un `div` fourni par Svelte (les éléments fixes, les tailles en `vh` et
l'aperçu mobile regardent la fenêtre de l'édition), et insérer le HTML rendu avec `{@html}` (le CSS
fuit dans les deux sens, les liens font naviguer l'édition).

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

1. ~~**Sortir la plomberie du moteur.**~~ Fait : `createTenantSitePage` est le seul point d'entrée,
   l'app fournit `sendPrescription`, `layouts` n'a plus de build et expose `/manifest`, le banc d'essai
   compile lui-même son aperçu.
2. **L'app SolidStart** (`app/site`) : une route attrape-tout qui lit `content`, `pharmacy-db` et
   `group-db`, avec du cache ; le tenant vient d'un en-tête posé par la passerelle (en dev, Caddy le
   déduit de `<slug>.site.localhost`) ; une route `/__preview` prête pour l'iframe de `site-manager`.
3. **`site-manager`** : choix du layout, réglages (lus dans le manifeste), modules activés, aperçu.
4. **Ajouter le thème personnalisable** (section 4).
5. **Ajouter l'ordre des modules** (section 5), après avoir tranché les questions.

## Pistes notées, non prioritaires

- La règle « carte de fidélité seulement avec un groupement » dans le schéma.
- Les tests.
