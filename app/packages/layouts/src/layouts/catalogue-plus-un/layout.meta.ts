import type { CatalogueCompletePlusUniqueLayoutMeta } from '../../layout-module-contracts';
import type { SiteModuleInstance } from '../../module-order';
import type { PharmacyInfoField, PharmacyInfoModule } from '../../modules/main/pharmacy-info';
import type { BrandsField, BrandsModule } from '../../modules/catalogue/brands';
import type { TestimonialsField, TestimonialsModule } from '../../modules/catalogue/testimonials';
import type { TeamField, TeamModule } from '../../modules/catalogue/team';
import type { HeroField, HeroModule } from '../../modules/unique/hero';

// Layout de test : tous les modules catalogue + 1 module unique (hero).
// orderable: true (choix arbitraire pour ce layout de test — le cas
// orderable: false du mélange catalogue+unique est déjà couvert par
// catalogue-fixe/unique-fixe pour chaque famille séparément).
// kind: 'catalogue-complet-plus-unique' → TS exige tous les
// CATALOGUE_MODULE_KEYS dans `supports` ; le module unique (ici hero) est
// exigé simplement parce qu'il fait partie de ModuleKey.
export type CataloguePlusUnModuleKey = 'pharmacyInfo' | 'brands' | 'testimonials' | 'team' | 'hero';

export const cataloguePlusUnMeta = {
	id: 'catalogue-plus-un',
	kind: 'catalogue-complet-plus-unique',
	orderable: true,
	supports: {
		pharmacyInfo: true,
		brands: true,
		testimonials: true,
		team: true,
		hero: true
	}
} satisfies CatalogueCompletePlusUniqueLayoutMeta<
	CataloguePlusUnModuleKey,
	PharmacyInfoField | BrandsField | TestimonialsField | TeamField | HeroField
>;

export interface CataloguePlusUnSiteData {
	modules: SiteModuleInstance<CataloguePlusUnModuleKey>[];
	pharmacyInfo: PharmacyInfoModule;
	brands: BrandsModule[];
	testimonials: TestimonialsModule[];
	team: TeamModule[];
	hero: HeroModule;
}
