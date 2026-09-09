import type { PharmacyInfoModule } from './modules/main/pharmacy-info';
import type { BrandsModule } from './modules/catalogue/brands';
import type { TestimonialsModule } from './modules/catalogue/testimonials';
import type { TeamModule } from './modules/catalogue/team';
import type { HeroModule } from './modules/unique/hero';
import type { AboutModule } from './modules/unique/about';

// Registre central des modules : l'unique endroit où un module existe.
// Y ajouter une ligne suffit à le rendre déclarable par un layout ; aucun
// layout ne redit jamais la donnée, la famille ni la cardinalité.
export interface ModuleData {
	pharmacyInfo: PharmacyInfoModule;
	brands: BrandsModule[];
	testimonials: TestimonialsModule[];
	team: TeamModule[];
	hero: HeroModule;
	about: AboutModule;
}

export type ModuleKey = keyof ModuleData;

// La famille décide à quels genres de layout un module appartient. Table
// unique : les listes par famille en sont dérivées, jamais retapées.
export const MODULE_FAMILY = {
	pharmacyInfo: 'main',
	brands: 'catalogue',
	testimonials: 'catalogue',
	team: 'catalogue',
	hero: 'unique',
	about: 'unique'
} as const satisfies Record<ModuleKey, ModuleFamily>;

export type ModuleFamily = 'main' | 'catalogue' | 'unique';

export type ModuleKeyOfFamily<F extends ModuleFamily> = {
	[K in ModuleKey]: (typeof MODULE_FAMILY)[K] extends F ? K : never;
}[ModuleKey];

// Modules obligatoires pour tout layout, quel que soit son genre : ils ne
// sont écrits dans aucun layout, ils sont ajoutés par construction.
export type MainModuleKey = ModuleKeyOfFamily<'main'>;

// Forme unitaire d'un module, dérivée de sa donnée : un module collection
// (brands) donne son élément, un module simple (pharmacyInfo) se donne
// lui-même. C'est ce que consomme un organism.
export type ModuleItem<K extends ModuleKey> =
	ModuleData[K] extends readonly (infer Item)[] ? Item : ModuleData[K];

export type ModuleField<K extends ModuleKey> = Extract<keyof ModuleItem<K>, string>;
