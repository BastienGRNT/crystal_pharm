# Le système de designs

Règles de ce package. `CLAUDE.md` à la racine n'en garde que les invariants ;
tout le détail est ici, à côté du code qu'il décrit.

Un **design** est ce que le pharmacien choisit ; une **section** est un bloc
de sa page ; une **assurance** est la promesse que porte le design.

- Trois assurances : `complete` garantit toutes les sections essentielles ;
  `signature` laisse le design libre et ne garantit que l'essentiel de
  l'officine ; `custom` ne promet rien, pas même l'essentiel, et son accès est
  restreint à des tenants nommés. Lire `src/assurances.ts`, c'est connaître
  chaque promesse.
- **L'assurance décide de la quantité de vérification.** Un design n'est
  jamais bridé au-delà de ce qu'il promet : c'est ce qui permet des designs
  originaux sans décevoir un pharmacien, puisque l'étiquette dit la vérité.
- Un design se déclare en **deux fichiers** : `design.ts` (nom, assurance,
  réordonnable) et `Page.svelte`, qui ne contient que le contrat et l'ordre —
  une section par `{#snippet}`, l'ordre d'écriture étant l'ordre d'affichage.
  Il ne déclare ni son id (c'est le dossier) ni la liste de ses sections.
  **Rien n'est généré, aucune commande n'est nécessaire pour que le code
  fonctionne.**
- Le HTML vit sous le design, en **atomic design** : `organisms/` (une section
  entière, appelée par son snippet), `molecules/`, `atoms/`. On ne crée un
  atome ou une molécule que s'il sert au moins deux fois ou s'il est une
  primitive autonome — sinon il reste dans son organism. **Jamais d'atomes
  partagés entre designs** : la variété visuelle vendue au pharmacien
  disparaîtrait, et une retouche en changerait vingt d'un coup.
- Le type des props d'un sous-composant se **dérive** du contenu de la section
  (`TeamContent['members'][number]`), jamais retapé à la main. Retaper élargit
  silencieusement `TrustedImageUrl` en `string` — aucune erreur ne le signale,
  et ce composant accepterait ensuite n'importe quelle URL.
- **Loi des frères** : une section possède tout son HTML et les sections sont
  posées côte à côte. Ce n'est pas une règle à respecter — c'est l'hôte de
  gamme qui les pose, un design n'a aucun moyen de les imbriquer. Une mise en
  page 2D se fait en CSS sur cette liste de frères.
- Ajouter une section au produit = une ligne dans `src/sections/registry.ts`
  plus son analyseur. **Ça ne casse aucun design.** Ça ne devient une promesse
  que le jour où on l'ajoute à une assurance — et là, tous les designs de
  cette gamme cessent de compiler en nommant la section. Les deux décisions
  sont séparées exprès.
- **Frontière de validation** : tout contenu entre en `unknown` et ne ressort
  que scellé. `sections/registry.ts` est le seul fichier du dépôt capable de
  sceller — le sceau n'est exporté nulle part, donc il n'y a aucun import à
  interdire. Le seul contenu qu'un design voit est le paramètre que l'hôte
  passe à son snippet, appelé uniquement si la section est remplie —
  donc aucun design n'écrit de garde d'absence. Les URLs sont des types
  produits par `new URL()` + allowlist (`https:`, `mailto:`, `tel:`), jamais
  des `string`. Une section à qui il manque une donnée requise n'est pas
  affichée : la dégradation est par section, jamais par champ.
- L'ordre stocké par un site traverse la même frontière : clé inconnue
  écartée, doublon écarté, section oubliée remise à sa place. Un design à
  ordre fixe l'ignore. `SiteRenderer` est le seul composant qui rend un site,
  et il prend le contenu en `unknown` : aucun chemin ne contourne la frontière.
- Tout ce qui est promis est vérifié par le seul `svelte-check` : section
  promise oubliée (nommée), écrite deux fois, inventée, sur-mesure sans
  `tenants`. Aucun générateur, aucun lint maison, aucun rendu de vérification.
