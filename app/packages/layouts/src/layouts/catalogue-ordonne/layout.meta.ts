import type { CatalogueCompleteLayoutMeta } from '../../layout-module-contracts';
import type { SiteModuleInstance } from '../../module-order';
import type { PharmacyInfoField, PharmacyInfoModule } from '../../modules/main/pharmacy-info';
import type { BrandsField, BrandsModule } from '../../modules/catalogue/brands';
import type { TestimonialsField, TestimonialsModule } from '../../modules/catalogue/testimonials';
import type { TeamField, TeamModule } from '../../modules/catalogue/team';

// Layout de test : tous les modules catalogue, réordonnables par le site.
// kind: 'catalogue-complet' → TS exige tous les CATALOGUE_MODULE_KEYS dans
// `supports` (brands, testimonials, team) : en oublier un ne compile pas.
export type CatalogueOrdonneModuleKey = 'pharmacyInfo' | 'brands' | 'testimonials' | 'team';

export const catalogueOrdonneMeta = {
	id: 'catalogue-ordonne',
	kind: 'catalogue-complet',
	orderable: true,
	supports: {
		pharmacyInfo: true,
		brands: true,
		testimonials: true,
		team: true
	}
} satisfies CatalogueCompleteLayoutMeta<
	CatalogueOrdonneModuleKey,
	PharmacyInfoField | BrandsField | TestimonialsField | TeamField
>;

export interface CatalogueOrdonneSiteData {
	modules: SiteModuleInstance<CatalogueOrdonneModuleKey>[];
	pharmacyInfo: PharmacyInfoModule;
	brands: BrandsModule[];
	testimonials: TestimonialsModule[];
	team: TeamModule[];
}
