import {
	MODULE_FAMILY,
	type MainModuleKey,
	type ModuleData,
	type ModuleField,
	type ModuleItem,
	type ModuleKey,
	type ModuleKeyOfFamily
} from './module-registry';
import type { SiteModuleInstance } from './module-order';

// Le genre d'un layout décide à lui seul des modules garantis : un layout
// ne redit jamais la liste que son genre implique déjà.
export type LayoutKind = 'catalogue-complet' | 'unique-complet' | 'catalogue-partiel';

export type KindModuleKey<Kind extends LayoutKind> = Kind extends 'catalogue-complet'
	? MainModuleKey | ModuleKeyOfFamily<'catalogue'>
	: Kind extends 'unique-complet'
		? MainModuleKey | ModuleKeyOfFamily<'unique'>
		: MainModuleKey;

// `plus` ne peut ajouter qu'un module que le genre n'apporte pas déjà.
export type ExtraModuleKey<Kind extends LayoutKind> = Exclude<ModuleKey, KindModuleKey<Kind>>;

// Contrat de champs d'un module : `true` = toute la forme canonique, sinon
// le sous-ensemble nommé et ordonné déclaré par le layout.
export type FieldsContract<Key extends ModuleKey> = {
	[K in Key]: true | readonly ModuleField<K>[];
};

// Ce qu'un layout écrit : uniquement les modules qu'il restreint.
export type FieldsSpec<Key extends ModuleKey> = {
	[K in Key]?: readonly ModuleField<K>[];
};

// Tout module non mentionné vaut `true` : le contrat complet est déduit,
// jamais retapé module par module.
export type ResolvedFields<Key extends ModuleKey, Spec> = {
	[K in Key]: K extends keyof Spec
		? Spec[K] extends readonly ModuleField<K>[]
			? Spec[K]
			: true
		: true;
};

// Message porté par le type lui-même : quand `order` est incomplet, TS
// nomme le module manquant au lieu d'afficher un mismatch de tableaux.
export interface MissingFromOrder<Missing extends string> {
	readonly __erreur: 'module absent de `order`';
	readonly manquant: Missing;
}

export type ExhaustiveOrder<Key extends ModuleKey, Order extends readonly Key[]> = [
	Exclude<Key, Order[number]>
] extends [never]
	? Order
	: MissingFromOrder<Exclude<Key, Order[number]>>;

export interface LayoutMeta<
	Key extends ModuleKey = ModuleKey,
	Fields extends FieldsContract<Key> = FieldsContract<Key>
> {
	id: string;
	kind: LayoutKind;
	orderable: boolean;
	// Ordre canonique du layout : celui de `order` s'il est déclaré, sinon
	// celui du registre. Source unique de l'ordre de rendu.
	keys: readonly Key[];
	fields: Fields;
}

// Contrainte souple pour tout ce qui consomme un meta : `LayoutMeta<never>`
// ne marcherait pas (les génériques sont invariants), une forme
// structurelle accepte n'importe quel meta produit par defineLayout.
export interface AnyLayoutMeta {
	keys: readonly ModuleKey[];
	fields: Partial<FieldsContract<ModuleKey>>;
}

export type LayoutKey<Meta extends AnyLayoutMeta> = Meta['keys'][number];

// Ce qu'un layout reçoit pour se construire : une prop par module garanti
// par son genre, plus les modules activés par le site. En oublier une
// souligne la balise d'appel dans l'IDE.
export type LayoutProps<Meta extends AnyLayoutMeta> = {
	modules: readonly SiteModuleInstance<LayoutKey<Meta>>[];
} & {
	[K in LayoutKey<Meta>]: ModuleData[K];
};

// Ce qu'un organism reçoit : la forme unitaire du module, réduite aux
// champs que le layout a déclarés. Lire un champ non déclaré ne compile pas.
export type ModuleProps<Meta extends AnyLayoutMeta, K extends LayoutKey<Meta>> =
	Meta['fields'][K] extends readonly (infer F extends string)[]
		? Pick<ModuleItem<K>, Extract<F, keyof ModuleItem<K>>>
		: ModuleItem<K>;

const REGISTRY_ORDER = Object.keys(MODULE_FAMILY) as ModuleKey[];

interface LayoutSpec<
	Kind extends LayoutKind,
	Plus extends readonly ExtraModuleKey<Kind>[],
	Fields extends FieldsSpec<KindModuleKey<Kind> | Plus[number]>,
	Order extends readonly (KindModuleKey<Kind> | Plus[number])[]
> {
	id: string;
	kind: Kind;
	plus?: Plus;
	fields?: Fields;
	// Déclarer `order` fixe l'ordre du layout (le site ne peut plus le
	// changer) et exige la liste complète de ses modules.
	order?: ExhaustiveOrder<KindModuleKey<Kind> | Plus[number], Order>;
}

export function defineLayout<
	const Kind extends 'catalogue-complet' | 'unique-complet',
	const Plus extends readonly ExtraModuleKey<Kind>[] = readonly [],
	const Fields extends FieldsSpec<KindModuleKey<Kind> | Plus[number]> = {},
	const Order extends readonly (KindModuleKey<Kind> | Plus[number])[] = readonly []
>(
	spec: LayoutSpec<Kind, Plus, Fields, Order>
): LayoutMeta<
	KindModuleKey<Kind> | Plus[number],
	ResolvedFields<KindModuleKey<Kind> | Plus[number], Fields>
> {
	return buildLayout(spec);
}

// Un layout partiel n'a pas de complétude à déduire : la liste de ses
// modules est sa seule vraie information, donc la seule qu'il déclare.
// Les modules `main` restent implicites, comme pour les genres complets.
export type PartialModulesSpec = {
	[K in ModuleKeyOfFamily<'catalogue'>]?: true | readonly ModuleField<K>[];
};

type PartialKey<Modules> = MainModuleKey | Extract<keyof Modules, ModuleKey>;

interface PartialLayoutSpec<
	Modules extends PartialModulesSpec,
	Order extends readonly PartialKey<Modules>[]
> {
	id: string;
	modules: Modules;
	order?: ExhaustiveOrder<PartialKey<Modules>, Order>;
}

// Fonction distincte plutôt qu'une surcharge de `defineLayout` : une
// surcharge ferait dire « No overload matches this call » à TS sur la
// moindre faute, au lieu de nommer le module ou le champ fautif.
export function definePartialLayout<
	const Modules extends PartialModulesSpec,
	const Order extends readonly PartialKey<Modules>[] = readonly []
>(
	spec: PartialLayoutSpec<Modules, Order>
): LayoutMeta<PartialKey<Modules>, ResolvedFields<PartialKey<Modules>, Modules>> {
	return buildLayout({ ...spec, kind: 'catalogue-partiel' });
}

// Construit le meta à partir du registre. Les clés et les contrats sont
// calculés à l'exécution ; ce sont les signatures génériques publiques
// ci-dessus qui portent la garantie de type, d'où le cast du retour.
function buildLayout<Key extends ModuleKey, Fields extends FieldsContract<Key>>(spec: {
	id: string;
	kind: LayoutKind;
	plus?: unknown;
	fields?: unknown;
	modules?: unknown;
	order?: unknown;
}): LayoutMeta<Key, Fields> {
	const modules = spec.modules as Record<string, true | readonly string[]> | undefined;
	const declared = new Set<ModuleKey>(
		modules
			? [
					...REGISTRY_ORDER.filter((key) => MODULE_FAMILY[key] === 'main'),
					...(Object.keys(modules) as ModuleKey[])
				]
			: [
					...REGISTRY_ORDER.filter((key) => isKindKey(spec.kind, key)),
					...((spec.plus ?? []) as readonly ModuleKey[])
				]
	);

	const declaredOrder = Array.isArray(spec.order) ? (spec.order as ModuleKey[]) : null;
	const keys = (declaredOrder ?? REGISTRY_ORDER.filter((key) => declared.has(key))) as Key[];

	const contracts = (modules ?? spec.fields ?? {}) as Record<string, true | readonly string[]>;
	const fields = Object.fromEntries(keys.map((key) => [key, contracts[key] ?? true])) as Fields;

	return { id: spec.id, kind: spec.kind, orderable: declaredOrder === null, keys, fields };
}

function isKindKey(kind: LayoutKind, key: ModuleKey): boolean {
	const family = MODULE_FAMILY[key];
	if (family === 'main') return true;
	if (kind === 'catalogue-complet') return family === 'catalogue';
	if (kind === 'unique-complet') return family === 'unique';
	return false;
}
