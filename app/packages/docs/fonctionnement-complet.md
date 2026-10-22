# Fonctionnement complet

Ce document suit une visite sur le site d'une pharmacie, de la première requête jusqu'à l'envoi d'une
ordonnance. Chaque nom en `code` est un vrai fichier ou une vraie fonction du projet : on peut le
retrouver avec Ctrl+P dans l'éditeur.

1. [Les quatre paquets et qui dépend de qui](#1-les-quatre-paquets-et-qui-dépend-de-qui)
2. [Vue d'ensemble d'une visite](#2-vue-densemble-dune-visite)
3. [Côté serveur : de la requête au HTML](#3-côté-serveur--de-la-requête-au-html)
4. [L'algorithme de `renderTenantSite`, pas à pas](#4-lalgorithme-de-rendertenantsite-pas-à-pas)
5. [Ce qui se passe à l'intérieur de `TenantSiteRoot`](#5-ce-qui-se-passe-à-lintérieur-de-tenantsiteroot)
6. [Côté navigateur : l'hydratation](#6-côté-navigateur--lhydratation)
7. [L'envoi d'une ordonnance](#7-lenvoi-dune-ordonnance)
8. [Comment les données se transforment](#8-comment-les-données-se-transforment)
9. [Ce que le typage garantit, et où](#9-ce-que-le-typage-garantit-et-où)

---

## 1. Les quatre paquets et qui dépend de qui

La règle la plus importante du projet : les flèches ne vont que dans un sens. Le schéma ne connaît
personne, le moteur ne connaît que le schéma, les layouts ne connaissent que le moteur, et le
simulateur (le futur serveur des sites) assemble le tout.

```mermaid
flowchart LR
    subgraph apps["apps/"]
        simulator["<b>simulator</b><br/>serveur Hono de développement<br/>mocks · résolution du tenant<br/>faux endpoint API · fichiers statiques"]
    end
    subgraph packages["packages/"]
        layouts["<b>layouts</b><br/>essential · neighborhood · atelier<br/>chacun : une valeur PharmacySiteLayout<br/>+ layoutRegistry (découverte par dossiers)<br/>+ la compilation moteur + layouts"]
        renderer["<b>renderer</b><br/>le moteur Solid, sans aucun layout<br/>renderTenantSite · hydratation<br/>type PharmacySiteLayout · pageKit"]
        schema["<b>schema</b><br/>le contrat des données<br/>schémas Valibot + types<br/>aucune dépendance à Solid"]
    end
    simulator -->|"renderTenantSite(tenantSite, chemin, layoutRegistry)"| layouts
    simulator -->|"valide les mocks et les requêtes"| schema
    layouts -->|"type PharmacySiteLayout, definePage, props des modules"| renderer
    renderer -->|"types + validation"| schema
```

| Paquet | Il sait | Il ne sait pas |
|---|---|---|
| `schema` | À quoi ressemblent les données d'un site et d'une ordonnance | Qu'il existe Solid, un serveur, des layouts |
| `renderer` | Rendre n'importe quel `PharmacySiteLayout` avec des données validées, puis rendre la page interactive | Quels layouts existent, d'où viennent les données, quel est le tenant |
| `layouts` | Dessiner les sites, chacun à sa façon | D'où viennent les données, comment une page est envoyée au navigateur |
| `simulator` | Trouver le tenant à partir de l'URL, lire les mocks, servir les fichiers | Comment une page est dessinée |

---

## 2. Vue d'ensemble d'une visite

Une visite se passe en trois temps : le serveur envoie une page déjà complète, le navigateur la
rend interactive, puis le visiteur peut envoyer son ordonnance.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Visiteur
    participant Browser as Navigateur
    participant Server as simulator (server.ts)
    participant Engine as renderer (côté serveur)
    participant Client as renderer (client.js, dans le navigateur)
    participant Api as POST /api/prescriptions

    Visitor->>Browser: ouvre pharmacie-dupont.localhost:3000/
    Browser->>Server: GET /  (Host: pharmacie-dupont.localhost)
    Server->>Server: trouve le tenant, lit son mock, le valide
    Server->>Engine: renderTenantSite(tenantSite, "/", layoutRegistry)
    Engine-->>Server: { status: 200, html }
    Server-->>Browser: la page HTML complète
    Note over Browser: La page s'affiche immédiatement.<br/>Elle est complète mais encore figée.
    Browser->>Server: GET /_renderer/client.css et /_renderer/client.js
    Server-->>Browser: fichiers de packages/layouts/dist/client
    Browser->>Client: exécute client.js
    Client->>Client: relit les données écrites dans la page,<br/>hydrate avec le même composant racine
    Note over Browser: La page est maintenant interactive.
    Visitor->>Browser: remplit et envoie le formulaire d'ordonnance
    Browser->>Client: submitPrescription(form)
    Client->>Api: POST multipart (tenantId, prénom, nom, téléphone, fichier)
    Api-->>Client: 201 Created
    Client-->>Browser: le layout affiche « Ordonnance envoyée »
```

---

## 3. Côté serveur : de la requête au HTML

Tout part de `app.get('*')` dans `apps/simulator/src/server.ts`. Le simulateur décide quel tenant
est demandé, puis délègue tout le rendu au moteur.

```mermaid
flowchart TD
    request(["Requête GET<br/>Host + chemin + ?tenant="]) --> resolve

    resolve["<b>resolveTenantFromHostOrQuery</b>(host, ?tenant)<br/>'pharmacie-dupont.localhost' → 'pharmacie-dupont'<br/>sinon la valeur de ?tenant="]
    resolve --> hasTenant{"un tenant ?"}

    hasTenant -- non --> referer{"<b>findTenantInRefererQuery</b><br/>la page précédente<br/>avait-elle ?tenant= ?"}
    referer -- oui --> redirect(["302 vers le même chemin<br/>+ ?tenant=…<br/>(un lien &lt;a href='/ordonnance'&gt;<br/>perd sinon le paramètre)"])
    referer -- non --> index(["<b>renderMockTenantIndexPage</b><br/>la liste des pharmacies mock"])

    hasTenant -- oui --> find["<b>findValidatedTenantSite</b>(tenantId)<br/>joue le rôle de l'API"]
    find --> mockExists{"un mock<br/>pour ce tenant ?"}
    mockExists -- non --> unknown(["404 « Aucun mock pour le tenant »"])
    mockExists -- oui --> validate{"v.safeParse(<b>TenantSiteSchema</b>, mock)<br/>données valides ?<br/>modules imposés par le groupement activés ?"}
    validate -- non --> invalid(["Erreur lisible → app.onError<br/>500 « Le mock ne respecte pas TenantSiteSchema »<br/>+ la liste exacte des problèmes"])
    validate -- oui --> render["<b>renderTenantSite</b>(tenantSite, chemin, layoutRegistry)<br/>voir la section 4"]
    render --> response(["c.html(html, status)<br/>200 ou 404"])
```

Les fichiers statiques sont servis avant cette route :

| URL | Dossier servi | Contenu |
|---|---|---|
| `/_renderer/*` | `packages/layouts/dist/client` | `client.js`, `client.css`, polices |
| `/mock-images/*` | `apps/simulator/public/mock-images` | Photos et logos des mocks |
| `POST /api/prescriptions` | `handlePrescriptionUploadRequest` | Le faux endpoint, voir la section 7 |

---

## 4. L'algorithme de `renderTenantSite`, pas à pas

Le moteur reçoit les layouts en paramètre (`layoutRegistry`). Ils sont trouvés **par les dossiers** de
`packages/layouts/src/` : le dossier `atelier/`, dont `atelier.ts` exporte un `PharmacySiteLayout`, est
le layout `atelier`, et le fichier `atelier/pages/ordonnance.tsx` est sa page `/ordonnance`. Aucune
liste n'est déclarée à la main.

`packages/renderer/src/renderTenantSite.tsx` est le point d'entrée du moteur côté serveur. Il reçoit
un `TenantSite` **déjà validé** et un chemin, et renvoie `{ status, html }`.

```mermaid
flowchart TD
    startStep(["renderTenantSite(tenantSite, requestedPath, layouts)"]) --> findLayoutStep

    findLayoutStep["<b>layouts.findLayoutById</b>(tenantSite.layoutId)<br/>cherche parmi les dossiers de packages/layouts/src/<br/>qui exportent un PharmacySiteLayout"]
    findLayoutStep --> layoutFoundCheck{"layout connu ?"}
    layoutFoundCheck -- non --> layoutErrorEnd(["throw « Layout inconnu : … Layouts disponibles : … »"])
    layoutFoundCheck -- oui --> findPageStep["<b>layout.findPage</b>(requestedPath)<br/>'/' → pages/index.tsx<br/>'/ordonnance' → pages/ordonnance.tsx"]

    findPageStep --> pageFoundCheck{"page trouvée ?"}
    pageFoundCheck -- non --> notFoundEnd(["{ status: 404,<br/>html: <b>renderNotFoundDocument</b>(pharmacy) }"])
    pageFoundCheck -- oui --> renderDataStep["Prépare <b>TenantSiteRenderData</b><br/>{ tenantSite, requestedPath,<br/>renderedAt: new Date().toISOString() }<br/><i>l'heure est figée ici, une fois pour toutes</i>"]

    renderDataStep --> renderToStringStep["<b>renderToString</b>(() => &lt;TenantSiteRoot renderData /&gt;)<br/>Solid exécute tout l'arbre de composants<br/>et produit le HTML du corps de la page<br/>voir la section 5"]
    renderToStringStep --> htmlDocumentStep["<b>renderHtmlDocument</b>({ title, bodyHtml, renderData })<br/>html-document/renderHtmlDocument.ts"]

    htmlDocumentStep --> documentPartsStep["Le document contient, dans l'ordre :<br/>1. &lt;title&gt; « Accueil · Pharmacie Dupont »<br/>2. &lt;link&gt; vers /_renderer/client.css<br/>3. le script d'hydratation de Solid<br/>4. &lt;div id='tenant-site'&gt; + le HTML rendu<br/>5. &lt;script type='application/json'&gt; renderData<br/>   (les &lt; sont échappés en <)<br/>6. &lt;script type='module'&gt; vers /_renderer/client.js"]
    documentPartsStep --> doneEnd(["{ status: 200, html }"])
```

> **Pourquoi l'heure est-elle figée dans `renderData` ?** Les horaires (« Aujourd'hui ») et la garde
> (« En garde actuellement ») dépendent de l'heure. Si le serveur et le navigateur lisaient chacun leur
> horloge, ils pourraient produire un HTML différent et l'hydratation casserait. Le serveur fixe donc
> l'heure une fois, et le navigateur réutilise exactement la même.

---

## 5. Ce qui se passe à l'intérieur de `TenantSiteRoot`

`packages/renderer/src/TenantSiteRoot.tsx` est **le même composant** sur le serveur et dans le
navigateur. C'est lui qui prépare tout ce que le layout va recevoir.

```mermaid
flowchart TD
    root(["&lt;TenantSiteRoot renderData layouts /&gt;"]) --> findLayout["<b>layouts.findLayoutById</b>(layoutId)<br/>puis <b>layout.findPage</b>(requestedPath)"]

    findLayout --> submit["<b>createSubmitPrescription</b>({ apiBaseUrl, tenantId })<br/>prescription/createSubmitPrescription.ts<br/>→ la fonction submitPrescription(form)<br/><i>l'URL de l'API et le tenant restent enfermés dedans</i>"]

    submit --> props["<b>toEnabledModulesProps</b>(tenantSite.modules, { renderedAt, submitPrescription })<br/>module-props/toEnabledModulesProps.ts<br/>pour chacun des 6 modules :<br/>activé → toXxxModuleProps(data) · désactivé → undefined"]

    props --> kit["<b>createPageKit</b>({ pharmacy, moduleComponents, enabledModulesProps })<br/>page-kit/createPageKit.tsx<br/>→ { Page, LegalNotice, Module }"]

    kit --> renderPage["<b>page.render</b>({ pharmacy, layoutSettings, modules, pageKit })<br/>layout-registry/createLayoutRegistry.ts"]

    renderPage --> settings{"v.safeParse(<b>layout.settingsSchema</b>, layoutSettings)<br/>réglages valides ?"}
    settings -- non --> settingsError(["throw « Réglages invalides pour le layout … »"])
    settings -- oui --> component["<b>page.component</b>({ pharmacy, settings, modules, pageKit })<br/>le definePage du fichier de page<br/>(settings contient les valeurs par défaut)"]

    component --> layoutCode["Code libre du layout :<br/>templates, organisms, molecules, atoms<br/>qui utilisent pharmacy, settings, modules"]
    layoutCode --> moduleSlot["&lt;pageKit.Module name='team' /&gt;<br/>→ si modules.team existe :<br/>   layout.team(props)<br/>→ sinon : rien (pas de section vide)"]
    layoutCode --> pageCall["return <b>pageKit.Page</b>({<br/>  legalNotice: <b>pageKit.LegalNotice</b>({ class }),<br/>  children: …<br/>})<br/>→ Part&lt;'page'&gt;"]

    moduleSlot --> wrap
    pageCall --> wrap(["&lt;div class='layout-{id}'&gt; … &lt;/div&gt;<br/>la classe racine qui délimite le CSS du layout"])
```

Le layout **ne reçoit jamais** le `TenantSite` entier. Il ne reçoit que :

| Prop | Contenu | D'où ça vient |
|---|---|---|
| `pharmacy` | Nom, adresse, téléphone, logo, groupement… | `tenantSite.pharmacy`, tel quel |
| `settings` | Les réglages du layout, avec leurs valeurs par défaut | `tenantSite.layoutSettings` validé par `layout.settingsSchema` |
| `modules` | Les props de chaque module activé, `undefined` sinon | `toEnabledModulesProps` |
| `pageKit` | `Page`, `LegalNotice`, `Module` | `createPageKit` |

---

## 6. Côté navigateur : l'hydratation

`packages/layouts/src/browserEntry.tsx` est compilé dans `client.js` : il appelle
`hydrateTenantSite(layoutRegistry)` (`packages/renderer/src/hydrateTenantSite.tsx`). Il refait exactement le
même calcul que le serveur, avec les mêmes données, mais au lieu de produire du HTML, Solid **se
rattache** au HTML déjà affiché.

```mermaid
sequenceDiagram
    autonumber
    participant Page as HTML reçu
    participant Hydrate as hydrateTenantSite.tsx
    participant Root as TenantSiteRoot
    participant Solid as Solid (hydrate)

    Page->>Hydrate: le navigateur exécute client.js
    Hydrate->>Page: getElementById('tenant-site-render-data')
    Page-->>Hydrate: le JSON écrit par le serveur
    Hydrate->>Hydrate: JSON.parse → TenantSiteRenderData<br/>(même tenantSite, même chemin, même renderedAt)
    Hydrate->>Solid: hydrate(() => TenantSiteRoot(renderData, layoutRegistry), #tenant-site)
    Solid->>Root: exécute le composant racine
    Root->>Root: mêmes étapes que la section 5<br/>(layouts.findLayoutById, toEnabledModulesProps, createPageKit…)
    Root-->>Solid: le même arbre de composants
    Solid->>Page: réutilise chaque nœud HTML existant<br/>(repérés par les attributs data-hk)
    Solid->>Page: branche les événements : onClick, onInput, onSubmit
    Note over Page: Aucun élément n'est redessiné : vérifié dans le navigateur,<br/>100 % des nœuds envoyés par le serveur sont réutilisés.
```

Pour que ça marche, il faut que le serveur et le navigateur produisent **exactement** le même arbre.
D'où ces règles, appliquées partout :

| Règle | Pourquoi |
|---|---|
| L'heure vient de `renderedAt`, jamais de `new Date()` dans un composant | Même texte sur le serveur et dans le navigateur |
| Les dates sont formatées par `formatInParisTimeZone` | Même résultat quel que soit le fuseau de la machine |
| On ne déstructure pas les props Solid (`props.x`, pas `const { x } = props`) | Solid suit les changements à travers `props` |
| `<Show>` et `<For>` pour les conditions et les listes | Solid sait les hydrater et les mettre à jour |

---

## 7. L'envoi d'une ordonnance

Le formulaire est écrit **librement** par chaque layout : ses champs, son état, ses étapes, ses
messages. Le moteur ne lui donne que deux fonctions typées, dans les props du module
`prescriptionUpload`.

```mermaid
sequenceDiagram
    autonumber
    actor Visitor as Visiteur
    participant Form as Formulaire du layout<br/>(ex. atelier/PrescriptionSteps.tsx)
    participant Validate as validatePrescription<br/>(prescription/validatePrescriptionForm.ts)
    participant Submit as submitPrescription<br/>(prescription/createSubmitPrescription.ts)
    participant Handler as handlePrescriptionUploadRequest<br/>(simulator)

    Visitor->>Form: clique sur « Suivant » (formulaire par étapes)
    Form->>Validate: validatePrescription({ firstName, lastName, phone, file })
    Validate-->>Form: { firstName?: "Indiquez votre prénom.", … }
    Form->>Form: ne garde que les erreurs des champs de l'étape,<br/>passe à l'étape suivante s'il n'y en a pas

    Visitor->>Form: clique sur « Envoyer »
    Form->>Submit: submitPrescription(form)
    Submit->>Validate: même validation
    alt un champ est invalide
        Submit-->>Form: { outcome: 'invalid', errorsByField }
    else tout est valide
        Submit->>Submit: ajoute tenantId (caché dans la fonction)<br/>construit un FormData
        Submit->>Handler: fetch POST ${apiBaseUrl}/prescriptions
        Handler->>Handler: v.safeParse(PrescriptionUploadRequestSchema, body)
        alt requête invalide
            Handler-->>Submit: 400 { error }
        else tenant inconnu
            Handler-->>Submit: 404 { error }
        else module prescriptionUpload désactivé pour ce tenant
            Handler-->>Submit: 403 { error }
        else tout est bon
            Handler->>Handler: console.log(tenant, patient, téléphone, fichier, taille)
            Handler-->>Submit: 201 { received: true }
        end
        Submit-->>Form: { outcome: 'sent' } ou { outcome: 'failed' }
    end
    Form-->>Visitor: le layout affiche le message qu'il a choisi
```

Pourquoi ce découpage :

- **Le layout ne peut pas oublier un champ.** `submitPrescription` exige un objet avec `firstName`,
  `lastName`, `phone` et `file` : un champ manquant ne compile pas.
- **Le layout ne peut pas appeler l'API lui-même.** Il ne connaît ni son URL ni le tenant : ils sont
  enfermés dans `createSubmitPrescription`.
- **Les règles de validation sont écrites une seule fois.** `PrescriptionUploadRequestSchema` (dans
  `schema`) sert au navigateur et au serveur.

---

## 8. Comment les données se transforment

Les données de l'API ne vont pas telles quelles dans les composants. Elles passent par des fonctions
`toXxxModuleProps`, qui préparent ce qui est pénible ou risqué à faire dans un layout.

```mermaid
flowchart LR
    subgraph api["Données de l'API (TenantSite)"]
        hours["openingHours.data<br/>weeklySchedule.monday = [{ opensAt, closesAt }]<br/>onDutyPeriods = [{ startsAt, endsAt }]"]
        team["team.data<br/>members = [{ fullName, role, photoUrl? }]"]
        news["news.data<br/>articles = [{ title, summary, publishedAt: '2026-10-14', imageUrl? }]"]
        prescription["prescriptionUpload.data<br/>{ introduction? }"]
        loyalty["loyaltyCard.data<br/>{ text, url, imageUrl? }"]
        services["services.data<br/>services = [{ title, description, iconName? }]"]
    end

    subgraph transform["module-props/ (moteur)"]
        toHours["<b>toOpeningHoursModuleProps</b><br/>jours dans l'ordre, en français<br/>'08:30 – 12:30', isToday<br/>+ computeOnDutyAnnouncement<br/>+ numéro 3237"]
        toTeam["<b>toTeamModuleProps</b><br/>+ initials : 'Hélène Dupont' → 'HD'"]
        toNews["<b>toNewsModuleProps</b><br/>tri du plus récent au plus ancien<br/>+ publishedAtLabel : '14 octobre 2026'"]
        toPrescription["<b>toPrescriptionUploadModuleProps</b><br/>+ submitPrescription<br/>+ validatePrescription"]
        toLoyalty["<b>toLoyaltyCardModuleProps</b><br/>(tel quel)"]
        toServices["<b>toServicesModuleProps</b><br/>(tel quel)"]
    end

    subgraph layout["Composant du layout"]
        layoutComponents["layout.openingHours<br/>layout.team<br/>layout.news<br/>layout.prescriptionUpload<br/>layout.loyaltyCard<br/>layout.services"]
    end

    hours --> toHours --> layoutComponents
    team --> toTeam --> layoutComponents
    news --> toNews --> layoutComponents
    prescription --> toPrescription --> layoutComponents
    loyalty --> toLoyalty --> layoutComponents
    services --> toServices --> layoutComponents
```

Exemple concret de la garde, calculée par `computeOnDutyAnnouncement` à partir de `renderedAt` :

| Situation | Message reçu par le layout |
|---|---|
| L'heure du rendu est dans une période de garde | `{ status: 'onDutyNow', message: "En garde actuellement, jusqu'à jeudi 08:00" }` |
| Une garde commence plus tard dans la journée | `{ status: 'onDutyLaterToday', message: 'En garde ce soir, à partir de 19:00' }` |
| Aucune garde aujourd'hui | `undefined` : le layout n'affiche rien |
| Dans tous les cas | `onDutyHotline` : « En dehors de nos horaires, composez le 3237… » |

---

## 9. Ce que le typage garantit, et où

| Garantie | Mécanisme | Fichier |
|---|---|---|
| Un layout qui oublie un module ne compile pas | `PharmacySiteLayout` exige une clé par `ModuleName` | `contract/PharmacySiteLayout.ts` |
| Un composant de module qui attend une prop inexistante ne compile pas | `Component<ModulePropsByName[Name]>`, déclaré comme propriété | `contract/PharmacySiteLayout.ts` |
| Le schéma de réglages produit bien le type utilisé par les pages | `PharmacySiteLayout<Réglages>` exige `settingsSchema: GenericSchema<unknown, Réglages>` | `contract/PharmacySiteLayout.ts` |
| Une page sans titre ne compile pas, et ses réglages sont typés | `definePage<Réglages>({ title, component })` | `contract/definePage.ts` |
| Un fichier de page mal exporté, ou des pages sans layout, sont signalés au démarrage | Vérification de chaque fichier trouvé | `layout-registry/createLayoutRegistry.ts` |
| Une page sans mentions légales ne compile pas | `Part<'page'>` n'est fabriqué que par `pageKit.Page`, qui exige un `Part<'legalNotice'>` | `contract/Part.ts`, `page-kit/createPageKit.tsx` |
| Un JSX écrit à la main n'est pas une page | `Part` est un type marqué ; `createPart` n'est pas exporté | `page-kit/createPageKit.tsx` |
| Une donnée optionnelle (photo, groupement…) est traitée comme optionnelle | `photoUrl?: string` : l'utiliser comme `string` ne compile pas | `schema` |
| Un formulaire d'ordonnance n'oublie aucun champ | `PrescriptionForm` exige les 4 champs | `prescription/validatePrescriptionForm.ts` |
| Un module imposé par le groupement ne peut pas être désactivé | `v.rawCheck` dans le schéma : vérifié à chaque validation | `schema/src/TenantSiteSchema.ts` |
| Un nouveau module doit être géré partout | `satisfies Record<ModuleName, …>` dans le schéma, puis `LayoutModuleComponents` | `schema/src/modules/TenantModulesSchema.ts` |
