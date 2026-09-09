import type { CatalogueCompleteLayoutMeta } from '../../layout-module-contracts';
import type { SiteModuleInstance } from '../../module-order';
import type { PharmacyInfoField, PharmacyInfoModule } from '../../modules/main/pharmacy-info';
import type { BrandsField, BrandsModule } from '../../modules/catalogue/brands';
import type { TestimonialsField, TestimonialsModule } from '../../modules/catalogue/testimonials';
import type { TeamField, TeamModule } from '../../modules/catalogue/team';

// Layout de test : tous les modules catalogue, ordre fixé par le layout
// (le site ne peut pas les réordonner).
// kind: 'catalogue-complet' → TS exige tous les CATALOGUE_MODULE_KEYS dans
// `supports` (brands, testimonials, team) : en oublier un ne compile pas.
export type CatalogueFixeModuleKey = 'pharmacyInfo' | 'brands' | 'testimonials' | 'team';

export const catalogueFixeMeta = {
	id: 'catalogue-fixe',
	kind: 'catalogue-complet',
	orderable: false,
	supports: {
		pharmacyInfo: true,
		brands: true,
		testimonials: true,
		team: true
	}
} satisfies CatalogueCompleteLayoutMeta<
	CatalogueFixeModuleKey,
	PharmacyInfoField | BrandsField | TestimonialsField | TeamField
>;

export interface CatalogueFixeSiteData {
	modules: SiteModuleInstance<CatalogueFixeModuleKey>[];
	pharmacyInfo: PharmacyInfoModule;
	brands: BrandsModule[];
	testimonials: TestimonialsModule[];
	team: TeamModule[];
}
