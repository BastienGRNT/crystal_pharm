# Créer un layout

Un layout, c'est **du code front libre** : tu écris ton HTML, ton CSS, ton état, tes animations comme
tu le ferais dans n'importe quel projet Solid. Le moteur ne te donne pas de « form builder » ni de
composants tout faits. Il **type** ce que tu écris pour que tu n'oublies rien : un module, les
mentions légales, un champ du formulaire d'ordonnance.

Les layouts vivent dans leur propre paquet, `engine/layouts`, séparé du moteur, sans build : c'est du code source que l'app des sites compile. Tout ce que le moteur
fournit s'importe depuis `@crystal-pharm/renderer`.

Exemple de référence, le plus court : `engine/layouts/src/essential/`.

## 1. L'arborescence

Chaque layout a son propre dossier, son CSS et son arborescence atomic design. **Le layout et ses
pages sont trouvés tout seuls** à partir des dossiers : il n'y a aucune liste à tenir à jour.

```
engine/layouts/src/monLayout/       ← le nom du dossier est l'identifiant du layout (layoutId: 'monLayout')
├─ monLayout.ts                  ← le layout : une valeur de type PharmacySiteLayout
├─ monLayoutManifest.ts         son nom, sa description et ses réglages (avec valeurs par défaut)
├─ monLayout.css                 tout le CSS, limité à .layout-monLayout
├─ atoms/                        petits éléments : titre, bouton, portrait…
├─ molecules/                    combinaisons d'atomes : une carte, une ligne d'horaire…
├─ organisms/                    les sections, dont un composant par module
├─ templates/                    la structure de page : menu, contenu, pied de page
└─ pages/                        ← une page par fichier, le nom du fichier donne l'URL
   ├─ index.tsx                  → /
   ├─ ordonnance.tsx             → /ordonnance
   └─ equipe/index.tsx           → /equipe (un sous-dossier marche aussi)
```

| Tu crées… | Le moteur en déduit… |
|---|---|
| le dossier `monLayout/`, dont un fichier exporte un `PharmacySiteLayout` | un layout `monLayout`, utilisable avec `layoutId: 'monLayout'` |
| le fichier `pages/ordonnance.tsx` | une page `/ordonnance` pour ce layout |

Un fichier de `pages/` qui n'exporte pas `definePage(...)` par défaut, un dossier qui a des pages mais
pas de `PharmacySiteLayout`, un layout sans page, ou un layout sans manifeste, déclenche une erreur claire dès le démarrage. Ne mets donc dans `pages/` que des pages : les composants vont dans
`atoms/` à `templates/`.

## 2. Les réglages

Les réglages sont ce que la pharmacie pourra personnaliser pour **ce** layout. Chacun a une valeur
par défaut. Ils ne dupliquent jamais une information de la pharmacie : l'adresse, le nom ou le logo
sont dans `pharmacy`.

```ts
// monLayoutManifest.ts
import { themeChoiceSetting, themeColorSetting } from '@crystal-pharm/schema';
import * as v from 'valibot';
import type { LayoutManifest } from '../manifest/LayoutManifest';

export const monLayoutSettingsSchema = v.object({
  slogan: v.pipe(v.optional(v.string(), 'Votre pharmacie, près de chez vous.'), v.title('Slogan')),
  showOnDutyBanner: v.pipe(v.optional(v.boolean(), true), v.title('Bandeau de garde')),
  // Le thème : chaque réglage devient une variable CSS du layout (cf. « Le thème » plus bas).
  primaryColor: themeColorSetting({ title: 'Couleur principale', cssVariable: '--ml-color-primary', defaultColor: '#1f6b45' }),
  headingFont: themeChoiceSetting({
    title: 'Police des titres',
    cssVariable: '--ml-font-heading',
    options: {
      fraunces: { label: 'Classique (Fraunces)', cssValue: "'Fraunces', Georgia, serif" },
      nunito: { label: 'Douce (Nunito)', cssValue: "'Nunito', system-ui, sans-serif" },
    },
    defaultOption: 'fraunces',
  }),
});

export type MonLayoutSettings = v.InferOutput<typeof monLayoutSettingsSchema>;

export const monLayoutManifest: LayoutManifest = {
  label: 'Mon layout',
  description: 'Une phrase qui aide la pharmacie à choisir.',
  settingsSchema: monLayoutSettingsSchema,
};
```

Le manifeste est ce que lit l'édition du site (`site-manager`, et le panneau du banc d'essai) par
`@crystal-pharm/layouts/manifest` : il ne doit importer ni Solid ni un composant. L'export s'appelle
obligatoirement `<id>Manifest`. `v.title` donne le libellé de chaque réglage, `optionLabels` celui
des options d'une liste.

Le moteur valide les réglages du tenant avec ce schéma avant d'appeler tes pages. Dans tes pages,
`props.settings.slogan` est donc toujours une `string`, jamais `undefined`.

### Le thème

Un réglage écrit avec `themeColorSetting` ou `themeChoiceSetting` (de `@crystal-pharm/schema`) est un
réglage du **thème** : le moteur pose sa valeur dans la variable CSS `cssVariable`, sur le
`<div class="layout-monLayout">`, ce qui écrase la valeur par défaut déclarée dans ton CSS. Tes
composants ne changent pas, et l'édition les range à part, sous « Couleurs et polices ».

- `themeColorSetting` : une couleur libre (`#rrggbb`, toute autre valeur est refusée). Les nuances
  qui en dépendent se calculent dans le CSS (`color-mix(in srgb, var(--ml-color-primary) 70%, black)`),
  jamais en dur.
- `themeChoiceSetting` : une liste fermée (police, palette). La valeur enregistrée est la clé de
  l'option, sa `cssValue` va dans la variable. Préfère-la quand une couleur libre pourrait rendre le
  layout illisible (un fond sombre, par exemple).
- Ne propose que ce que ton layout affiche proprement, et importe dans ton CSS chaque police
  proposée : le navigateur ne télécharge que celle qui s'affiche.

## 3. Un composant par module et par section fixe

Un site a deux sortes de blocs. Ton layout **doit** fournir un composant pour chacun, sinon il ne
compile pas.

- les **sections fixes** : toujours affichées, ni activables, ni déplaçables, ni imposables par un
  groupement. Il y en a 4 : `hero`, `findUs`, `onDuty`, `openingHours` ;
- les **modules** : la pharmacie les active et choisit leur ordre. Il y en a 8. Le moteur ne rend un
  module que s'il est activé. `loyaltyCard` n'est rendu que si la pharmacie appartient à un groupement.

Une section fixe ne reçoit jamais les réglages du layout : une valeur par défaut propre au layout (une
accroche, par exemple) vit dans le composant, qui prend `props.headline ?? maValeurParDéfaut`.

### Les sections fixes

| Section | Props reçues | Type à importer |
|---|---|---|
| `hero` | `pharmacy`, `imageUrl?` (l'image de la pharmacie : sans elle, prévois ton illustration par défaut), `headline?` | `HeroSectionProps` |
| `findUs` | `name`, `address`, `addressLabel`, `phone`, `accessInstructions?`, `parking?`, `publicTransport?`, `directionsUrl`, `mapEmbedUrl?` (à mettre dans une `iframe`) | `FindUsSectionProps` |
| `onDuty` | `announcement?` (la garde en cours ou à venir), `hotline` (le 3237, toujours fourni) | `OnDutySectionProps` |
| `openingHours` | `days[]` (`label`, `openingPeriodLabels[]`, `isToday`) | `OpeningHoursSectionProps` |

### Les modules

| Module | Props reçues | Type à importer |
|---|---|---|
| `team` | `members[]` (`fullName`, `role`, `photoUrl?`, `initials`) | `TeamModuleProps` |
| `services` | `services[]` (`title`, `description`, `iconName?`) | `ServicesModuleProps` |
| `news` | `articles[]` (`title`, `summary`, `imageUrl?`, `publishedAt`, `publishedAtLabel`), du plus récent au plus ancien | `NewsModuleProps` |
| `prescriptionUpload` | `introduction?`, `submitPrescription`, `validatePrescription` | `PrescriptionUploadModuleProps` |
| `loyaltyCard` | `text`, `url`, `imageUrl?` | `LoyaltyCardModuleProps` |
| `brands` | `brands[]` (`name`, `logoUrl?`, `url?`) | `BrandsModuleProps` |
| `onlineOrder` | `introduction?`, `orderPath` (toujours `/commandeenligne` : n'affiche jamais l'adresse externe) | `OnlineOrderModuleProps` |
| `appointment` | `mode: 'builtIn'` → `introduction?`, `listAvailableSlots`, `bookAppointment`, `validateAppointment` ; `mode: 'externalLink'` → `appointmentPath` (toujours `/rendezvous`) | `AppointmentModuleProps` |

Pour le rendez-vous intégré, `createAppointmentFormState(props)` fournit l'état du formulaire (champs,
erreurs, jour choisi, créneaux, envoi) : le layout ne fait que l'afficher.

### Les adresses stables

`/commandeenligne` (et `/rendezvous` quand le rendez-vous est un lien externe) redirigent en 302 vers
l'adresse configurée par la pharmacie : un QR code imprimé ne change jamais. Le moteur répond
`{ status: 'redirect', location }` ; c'est l'app qui sert le site qui envoie le 302. Les layouts
pointent toujours vers `orderPath` et `appointmentPath`.

```tsx
// organisms/TeamSection.tsx
import { For, Show } from 'solid-js';
import type { TeamModuleProps } from '@crystal-pharm/renderer';

export function TeamSection(props: TeamModuleProps) {
  return (
    <section class="ml-team">
      <h2>Notre équipe</h2>
      <ul>
        <For each={props.members}>
          {(member) => (
            <li>
              {/* photoUrl est optionnel : TypeScript t'oblige à gérer l'absence de photo. */}
              <Show when={member.photoUrl} fallback={<span class="ml-initials">{member.initials}</span>}>
                {(photoUrl) => <img src={photoUrl()} alt="" />}
              </Show>
              <strong>{member.fullName}</strong> {member.role}
            </li>
          )}
        </For>
      </ul>
    </section>
  );
}
```

## 4. Le formulaire d'ordonnance

C'est ton formulaire : tu choisis la disposition, les étapes, les messages. L'état (valeurs, erreurs,
envoi) vient de `createPrescriptionFormState`, et rien ne part sans passer par `props.submitPrescription`,
le seul moyen d'atteindre l'API.

```tsx
// organisms/PrescriptionSection.tsx
import { Show } from 'solid-js';
import { createPrescriptionFormState, type PrescriptionUploadModuleProps } from '@crystal-pharm/renderer';

export function PrescriptionSection(props: PrescriptionUploadModuleProps) {
  const state = createPrescriptionFormState(props);
  const { form, updateField, errorsByField, status } = state;

  return (
    <Show when={status() !== 'sent'} fallback={<p>Ordonnance envoyée, merci !</p>}>
      <form novalidate onSubmit={(event) => { event.preventDefault(); void state.send(); }}>
        <label>
          Prénom
          <input value={form.firstName} onInput={(event) => updateField('firstName', event.currentTarget.value)} />
          <Show when={errorsByField().firstName}>{(message) => <span>{message()}</span>}</Show>
        </label>
        {/* … les autres champs, placés où tu veux … */}
        <button type="submit" disabled={status() === 'sending'}>Envoyer</button>
      </form>
    </Show>
  );
}
```

Les champs du formulaire (`PrescriptionForm`) :

| Champ | Obligatoire | Note |
|---|---|---|
| `firstName`, `lastName`, `birthDate` (`2026-03-14`), `phone` | oui | `<input type="date">` pour la date de naissance |
| `plannedVisitAt` (`2026-03-14T17:30`) | oui | l'heure de passage prévue, `<input type="datetime-local">` |
| `prescriptionFile` | oui | photo ou PDF |
| `hasAlreadyVisited` | — | « je suis déjà venu » : la carte Vitale et la mutuelle sont alors écartées à l'envoi, **masque-les** |
| `socialSecurityNumber` **ou** `vitalCardPhoto` | non | au choix ; propose un sélecteur photo / numéro plutôt que deux champs |
| `mutualCardFront`, `mutualCardBack` | non | un seul choix côté interface (`setMutualCardFiles`) : un PDF, ou une à deux photos ; le 1er fichier va dans `Front`, le 2e dans `Back` |

La carte Vitale et la mutuelle sont facultatives (le formulaire sert aussi au comptoir) : dis-le au
visiteur comme un gain de temps, pas comme une corvée.

| Fonction de l'état | Rôle |
|---|---|
| `updateField(nom, valeur)` | Change un champ et efface son erreur |
| `validateFields(noms)` | Valide ces champs seulement, affiche leurs erreurs, dit s'ils sont valides : pour passer à l'étape suivante |
| `send()` | Valide, envoie, met à jour `status()` (`editing`, `sending`, `sent`, `failed`), renvoie les erreurs par champ |

Sans l'état fourni, `props.submitPrescription(form)` valide puis envoie (`{ outcome: 'sent' }`,
`{ outcome: 'invalid', errorsByField }` ou `{ outcome: 'failed' }`), et `props.validatePrescription(form)`
valide sans envoyer.

Un formulaire par étapes complet : `engine/layouts/src/atelier/organisms/PrescriptionSteps.tsx`.

## 5. Les pages

Chaque fichier de `pages/` exporte par défaut `definePage<TesRéglages>({ title, component })`.
`definePage` ne fait rien à l'exécution : il **type** la page. Il exige un `title` et un `component`
qui reçoit `pharmacy`, `settings`, `modules` et `pageKit`, et qui **doit** renvoyer `pageKit.Page(...)`.
Un JSX écrit à la main ne compile pas comme page : c'est ce qui garantit que les mentions légales sont
toujours présentes.

```tsx
// pages/index.tsx  →  la page /
import { Show } from 'solid-js';
import { definePage } from '@crystal-pharm/renderer';
import type { MonLayoutSettings } from '../monLayoutManifest';
import { PageTemplate } from '../templates/PageTemplate';

export default definePage<MonLayoutSettings>({
  title: 'Accueil',
  component: (props) =>
    props.pageKit.Page({
      legalNotice: props.pageKit.LegalNotice({ class: 'ml-legal-notice' }),
      children: (
        <PageTemplate pharmacy={props.pharmacy}>
          <h1>{props.pharmacy.name}</h1>
          <p>{props.settings.slogan}</p>

          {/* Lien affiché seulement si le module est activé. */}
          <Show when={props.modules.prescriptionUpload}>
            <a href="/ordonnance">Envoyer une ordonnance</a>
          </Show>

          {/* Une section fixe est toujours rendue. */}
          <props.pageKit.FixedSection name="hero" />
          <props.pageKit.FixedSection name="onDuty" />
          <props.pageKit.FixedSection name="openingHours" />

          {/* Les modules activés, dans l'ordre choisi par la pharmacie. `accepts` limite ceux d'une zone :
              un module qui a sa page à part (l'équipe) n'apparaît pas aussi ici. */}
          <props.pageKit.PlacedModules accepts={['services', 'news', 'loyaltyCard']} />

          <props.pageKit.FixedSection name="findUs" />
          {/* Un seul module à un endroit précis : <props.pageKit.Module name="team" /> */}
        </PageTemplate>
      ),
    }),
});
```

Le `title` devient le titre de l'onglet du navigateur : « Accueil · Pharmacie Dupont ».

| Prop | Contenu |
|---|---|
| `props.pharmacy` | Nom, adresse, téléphone, e-mail, logo, groupement (lecture seule) |
| `props.settings` | Tes réglages, valeurs par défaut comprises |
| `props.modules` | Les props de chaque module, `undefined` s'il est désactivé |
| `props.pageKit` | `Page`, `LegalNotice`, `Module`, `PlacedModules`, `FixedSection` |

## 6. Le layout : une valeur de type `PharmacySiteLayout`

Un layout n'est pas une configuration : c'est une valeur d'un type que le moteur sait rendre, et
seulement celui-là. Le type `PharmacySiteLayout` exige un composant pour chacun des 8 modules et des 4 sections fixes,
sous le nom tel qu'il arrive de l'API. Un module ou une section oubliés, ou un composant qui attend de mauvaises
props, ne compile pas.

```ts
// monLayout.ts
import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { monLayoutSettingsSchema, type MonLayoutSettings } from './monLayoutManifest';
// … imports des composants des modules et des sections fixes …
import './monLayout.css';

export const monLayout: PharmacySiteLayout<MonLayoutSettings> = {
  settingsSchema: monLayoutSettingsSchema,
  hero: HeroSection,
  findUs: FindUsSection,
  onDuty: OnDutySection,
  openingHours: OpeningHoursSection,
  team: TeamSection,
  services: ServicesSection,
  news: NewsSection,
  prescriptionUpload: PrescriptionSection,
  loyaltyCard: LoyaltyCardSection,
  brands: BrandsSection,
  appointment: AppointmentSection,
  onlineOrder: OnlineOrderSection,
};
// Sans `team` : « Property 'team' is missing in type … PharmacySiteLayout »
```

Ni identifiant (c'est le nom du dossier), ni liste de pages (ce sont les fichiers de `pages/`).
`PharmacySiteLayout<MonLayoutSettings>` vérifie aussi que le schéma de réglages produit bien le type
utilisé par tes pages.

## 7. Le tester

Rien à enregistrer : le dossier suffit, il est découvert par `engine/layouts/src/layoutRegistry.ts`.
Crée au moins deux mocks avec `layoutId: 'monLayout'` dans
`playground/src/server/mocks/tenants/` (un complet, un avec des données manquantes), et ajoute-les à
`allMockTenants.ts`. Avec le banc d'essai lancé (cf. `banc-d-essai.md`), un nouveau fichier de page ou de layout est pris en compte
en quelques secondes.

## 8. Le CSS

Le moteur entoure toute la page d'un `<div class="layout-monLayout">`. Commence **chaque** règle par
cette classe pour ne pas déborder sur les autres layouts, et passe les couleurs et polices par des
variables CSS, pour que le thème (cf. « Les réglages ») puisse les surcharger :

```css
@import '@fontsource/nunito/latin-400.css';

.layout-monLayout {
  --ml-color-background: #fbf6ec;
  --ml-color-primary: #1f6b45;
  --ml-font-body: 'Nunito', system-ui, sans-serif;

  background: var(--ml-color-background);
  font-family: var(--ml-font-body);
}

.layout-monLayout .ml-team { … }
```

Pour styliser les mentions légales, passe une classe à `pageKit.LegalNotice({ class: 'ml-legal-notice' })`.
Elles contiennent `.legal-notice__title` et `.legal-notice__text`.

## 9. Les règles Solid à respecter

| Règle | Pourquoi |
|---|---|
| Ne pas déstructurer les props : `props.member.fullName`, pas `const { member } = props` | Solid suit les changements à travers `props` |
| `<Show>` pour les conditions, `<For>` pour les listes | Solid sait les hydrater et les mettre à jour |
| Pas de `new Date()` ni de `window` au rendu ; ce qui touche au navigateur va dans `onMount` | Le serveur et le navigateur doivent produire le même HTML |
| Aucun `fetch` | La seule voie vers l'API est `submitPrescription` |
| Aucun `as` | Le typage doit rester honnête |
| Gérer chaque donnée optionnelle (`photoUrl?`, `group?`, `imageUrl?`…) | Pas d'image cassée ni de section vide |

## 10. Liste de contrôle

- [ ] `pnpm --filter @crystal-pharm/layouts check` passe : un module oublié, une page sans titre ou sans mentions légales, ou un champ d'ordonnance manquant le feraient échouer.
- [ ] Les deux mocks s'affichent dans le banc d'essai (http://localhost:5176).
- [ ] Un module désactivé ne laisse ni section vide, ni lien vers lui.
- [ ] Sans photo, sans logo, sans groupement : un remplacement propre, jamais une image cassée.
- [ ] Un nom de pharmacie très long ne casse pas la mise en page.
- [ ] Le formulaire d'ordonnance affiche les erreurs, puis « envoyée » ; l'envoi apparaît dans le journal du banc d'essai.
- [ ] Rien ne déborde horizontalement à 390 px de large.
- [ ] Chaque couleur et chaque police du thème, essayée dans l'aperçu, garde le texte lisible.
