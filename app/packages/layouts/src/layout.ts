import type { Component } from 'svelte';
import type {
	MainModuleKey,
	ModuleData,
	ModuleKey,
	ModuleKeyOfFamily
} from './modules/registry';

// Les trois genres de layout. Le genre décide seul des modules à afficher :
// un layout ne redit jamais la liste que son genre implique déjà.
// - catalogue-complet : main + tous les modules catalogue
// - unique-complet    : main + tous les modules unique
// - le 3e genre, « catalogue + un module unique », s'écrit
//   `kind: 'catalogue-complet'` avec `plus: ['hero']`.
export type LayoutKind = 'catalogue-complet' | 'unique-complet';

export type KindModuleKey<Kind extends LayoutKind> = Kind extends 'catalogue-complet'
	? MainModuleKey | ModuleKeyOfFamily<'catalogue'>
	: MainModuleKey | ModuleKeyOfFamily<'unique'>;

export type ExtraModuleKey<Kind extends LayoutKind> = Exclude<ModuleKey, KindModuleKey<Kind>>;

// Ce que reçoit le composant qui affiche un module. À utiliser tel quel
// dans chaque section : `let { data }: SectionProps<'brands'> = $props()`.
export interface SectionProps<K extends ModuleKey> {
	data: ModuleData[K];
}

// Exigé complet à la déclaration (voir LayoutSpec) : c'est là qu'oublier
// un module échoue.
export type Sections<Key extends ModuleKey> = {
	[K in Key]: Component<SectionProps<K>>;
};

export interface Layout<Key extends ModuleKey = ModuleKey> {
	id: string;
	kind: LayoutKind;
	orderable: boolean;
	// L'ordre d'écriture de `sections` : c'est l'ordre d'affichage quand le
	// layout n'est pas réordonnable.
	keys: readonly Key[];
	// Partiel ici, et seulement ici : c'est le type de transport, pour que
	// du code qui manipule « un layout quelconque » puisse les mettre dans
	// une même liste. La complétude est garantie par `defineLayout`.
	sections: { [K in Key]?: Component<SectionProps<K>> };
}

export type LayoutKey<L extends Layout> = L['keys'][number];

// La donnée d'un site pour ce layout : une clé par module, toutes requises.
export type LayoutData<L extends Layout> = { [K in LayoutKey<L>]: ModuleData[K] };

// Ce qu'un site a activé, et dans quel ordre s'il en a le droit. Un module
// absent d'ici n'est pas affiché : un module fraîchement ajouté au produit
// reste donc invisible chez les clients qui ne l'ont pas rempli.
export interface ActiveModule<Key extends ModuleKey = ModuleKey> {
	module: Key;
	order: number;
}

interface LayoutSpec<Kind extends LayoutKind, Plus extends readonly ExtraModuleKey<Kind>[]> {
	id: string;
	kind: Kind;
	// Modules d'une autre famille, en plus de ceux qu'impose le genre.
	plus?: Plus;
	// false = l'ordre ci-dessous s'impose, le site ne peut pas le changer.
	orderable: boolean;
	// Un composant par module du layout. En oublier un ne compile pas ;
	// l'ordre d'écriture est l'ordre d'affichage.
	sections: Sections<KindModuleKey<Kind> | Plus[number]>;
}

export function defineLayout<
	const Kind extends LayoutKind,
	const Plus extends readonly ExtraModuleKey<Kind>[] = readonly []
>(spec: LayoutSpec<Kind, Plus>): Layout<KindModuleKey<Kind> | Plus[number]> {
	return {
		id: spec.id,
		kind: spec.kind,
		orderable: spec.orderable,
		keys: Object.keys(spec.sections) as (KindModuleKey<Kind> | Plus[number])[],
		sections: spec.sections
	};
}

// Ordre d'affichage : celui voulu par le site si le layout est réordonnable,
// sinon celui du layout. Les modules non activés par le site sont exclus.
export function visibleModules<L extends Layout>(
	layout: L,
	active: readonly ActiveModule<LayoutKey<L>>[]
): LayoutKey<L>[] {
	const known = active.filter((entry) => layout.keys.includes(entry.module));

	if (layout.orderable) {
		return [...known].sort((a, b) => a.order - b.order).map((entry) => entry.module);
	}

	return layout.keys.filter((key) => known.some((entry) => entry.module === key));
}
