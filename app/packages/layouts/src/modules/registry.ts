import type { PharmacyInfo } from './main/pharmacy-info';
import type { Brand } from './catalogue/brands';
import type { Testimonial } from './catalogue/testimonials';
import type { TeamMember } from './catalogue/team';
import type { Hero } from './unique/hero';
import type { About } from './unique/about';

// LE registre. Ajouter un module au produit = une ligne ici et une dans
// MODULE_FAMILY. Tout le reste en découle : les layouts concernés
// refuseront de compiler tant qu'ils ne l'affichent pas.
export interface ModuleData {
	pharmacyInfo: PharmacyInfo;
	brands: Brand[];
	testimonials: Testimonial[];
	team: TeamMember[];
	hero: Hero;
	about: About;
}

export type ModuleKey = keyof ModuleData;

// - main      : obligatoire dans TOUS les layouts, jamais écrit nulle part
// - catalogue : obligatoire dans les layouts `catalogue-complet`
// - unique    : obligatoire dans les layouts `unique-complet`
export type ModuleFamily = 'main' | 'catalogue' | 'unique';

export const MODULE_FAMILY = {
	pharmacyInfo: 'main',
	brands: 'catalogue',
	testimonials: 'catalogue',
	team: 'catalogue',
	hero: 'unique',
	about: 'unique'
} as const satisfies Record<ModuleKey, ModuleFamily>;

export type ModuleKeyOfFamily<F extends ModuleFamily> = {
	[K in ModuleKey]: (typeof MODULE_FAMILY)[K] extends F ? K : never;
}[ModuleKey];

export type MainModuleKey = ModuleKeyOfFamily<'main'>;
