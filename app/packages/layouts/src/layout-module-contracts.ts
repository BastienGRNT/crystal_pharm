// Un module est déclaré soit en entier (`true` = tous les champs de la
// forme canonique), soit sur un sous-ensemble nommé et ordonné de champs.
// Pas de variante "bespoke" : un layout atypique ou réservé à un tenant
// reste un layout normal, juste avec un module exclusif dans `supports`.
export type ModuleFieldContract<Field extends string = string> =
	| true
	| { fields: readonly Field[] };

export type LayoutModuleContract<
	ModuleKey extends string = string,
	Field extends string = string
> = Partial<Record<ModuleKey, ModuleFieldContract<Field>>>;

export interface LayoutMeta<
	ModuleKey extends string = string,
	Field extends string = string
> {
	id: string;
	orderable: boolean;
	supports: LayoutModuleContract<ModuleKey, Field>;
}

// Dérive le type d'un organism directement du contrat déclaré dans
// `layout.meta.ts`, pour éviter de retaper à la main la liste des champs
// qu'il consomme : `fields` dans le meta reste l'unique source de vérité.
export type PickedFields<
	T extends Record<string, unknown>,
	Contract extends ModuleFieldContract<Extract<keyof T, string>> | undefined
> = Contract extends true
	? T
	: Contract extends { fields: readonly (infer F extends string)[] }
		? Pick<T, Extract<F, keyof T>>
		: never;
