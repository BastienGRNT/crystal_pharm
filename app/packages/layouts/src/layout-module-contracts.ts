// Un module est déclaré soit en entier (`true` = tous les champs de la
// forme canonique), soit sur un sous-ensemble nommé et ordonné de champs.
// Pas de variante "bespoke" : un layout atypique ou réservé à un tenant
// reste un layout normal, juste avec un module exclusif dans `supports`.
export type ModuleFieldContract<Field extends string = string> =
	| true
	| { fields: readonly Field[] };

// Modules obligatoires pour TOUT layout, quel que soit son genre — cf.
// modules/main. `LayoutModuleContract` les exige toujours dans `supports`,
// même si l'auteur oublie de les lister dans le ModuleKey du layout.
export const REQUIRED_MODULE_KEYS = ['pharmacyInfo'] as const;
export type RequiredModuleKey = (typeof REQUIRED_MODULE_KEYS)[number];

// Les deux familles de modules "de contenu" (au-delà du main obligatoire).
// Registre central : un layout qui se déclare complet pour une famille
// (cf. les types *CompleteLayoutMeta ci-dessous) doit fournir CHAQUE clé
// de cette famille dans `supports`, vérifié par TS.
export const CATALOGUE_MODULE_KEYS = ['brands', 'testimonials', 'team'] as const;
export type CatalogueModuleKey = (typeof CATALOGUE_MODULE_KEYS)[number];

export const UNIQUE_MODULE_KEYS = ['hero', 'about'] as const;
export type UniqueModuleKey = (typeof UNIQUE_MODULE_KEYS)[number];

// `supports` exige toujours une entrée pour chaque clé du layout
// (ModuleKey) et pour les modules obligatoires globaux (RequiredModuleKey)
// — jamais de `Partial` : un module absent de `supports` doit aussi être
// absent de ModuleKey, sinon ça ne compile pas.
export type LayoutModuleContract<
	ModuleKey extends string = string,
	Field extends string = string
> = Record<ModuleKey | RequiredModuleKey, ModuleFieldContract<Field>>;

export interface LayoutMeta<
	ModuleKey extends string = string,
	Field extends string = string
> {
	id: string;
	orderable: boolean;
	supports: LayoutModuleContract<ModuleKey, Field>;
}

// Le "genre" d'un layout : à lire en un coup d'œil dans son layout.meta.ts,
// sans avoir à ouvrir `supports` pour deviner ce qui est garanti.
// - CatalogueCompleteLayoutMeta : DOIT fournir tous les CATALOGUE_MODULE_KEYS.
// - UniqueCompleteLayoutMeta : DOIT fournir tous les UNIQUE_MODULE_KEYS.
// - CatalogueCompletePlusUniqueLayoutMeta : tous les CATALOGUE_MODULE_KEYS,
//   plus un module unique précis désigné par ModuleKey.
// - CataloguePartialLayoutMeta : aucune complétude imposée au-delà du
//   module obligatoire (main) — sous-ensemble libre de modules et/ou de
//   champs.
// Dans les 3 premiers cas, la complétude est vérifiée par TS : si un
// module requis par le genre manque dans `supports`, ça ne compile pas —
// même si l'auteur a aussi oublié de l'ajouter à ModuleKey.

// Chaque genre borne aussi ModuleKey : impossible d'y glisser un module
// hors famille (ex. "hero" dans un layout kind: 'catalogue-complet') —
// refusé à la compilation, sur la ligne layout.meta.ts, pas seulement par
// convention orale.

export interface CatalogueCompleteLayoutMeta<
	ModuleKey extends RequiredModuleKey | CatalogueModuleKey,
	Field extends string
> extends LayoutMeta<ModuleKey, Field> {
	kind: 'catalogue-complet';
	supports: Record<RequiredModuleKey | CatalogueModuleKey, ModuleFieldContract<Field>>;
}

export interface UniqueCompleteLayoutMeta<
	ModuleKey extends RequiredModuleKey | UniqueModuleKey,
	Field extends string
> extends LayoutMeta<ModuleKey, Field> {
	kind: 'unique-complet';
	supports: Record<RequiredModuleKey | UniqueModuleKey, ModuleFieldContract<Field>>;
}

// "Plus unique" : le catalogue complet est garanti, et ModuleKey peut en
// plus contenir un ou plusieurs modules unique (pas de limite à 1 — un
// layout peut très bien cumuler hero + about en plus du catalogue) : tout
// module hors registre (ni catalogue ni unique) reste refusé.
export interface CatalogueCompletePlusUniqueLayoutMeta<
	ModuleKey extends RequiredModuleKey | CatalogueModuleKey | UniqueModuleKey,
	Field extends string
> extends LayoutMeta<ModuleKey, Field> {
	kind: 'catalogue-complet-plus-unique';
	supports: Record<ModuleKey | RequiredModuleKey | CatalogueModuleKey, ModuleFieldContract<Field>>;
}

export interface CataloguePartialLayoutMeta<
	ModuleKey extends RequiredModuleKey | CatalogueModuleKey,
	Field extends string
> extends LayoutMeta<ModuleKey, Field> {
	kind: 'catalogue-partiel';
}

// Dérive le type d'un organism directement du contrat déclaré dans
// `layout.meta.ts`, pour éviter de retaper à la main la liste des champs
// qu'il consomme : `fields` dans le meta reste l'unique source de vérité.
export type PickedFields<
	T extends object,
	Contract extends ModuleFieldContract<Extract<keyof T, string>> | undefined
> = Contract extends true
	? T
	: Contract extends { fields: readonly (infer F extends string)[] }
		? Pick<T, Extract<F, keyof T>>
		: never;
