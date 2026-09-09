import type { CataloguePartialLayoutMeta } from '../../layout-module-contracts';
import type { SiteModuleInstance } from '../../module-order';
import type { PharmacyInfoField, PharmacyInfoModule } from '../../modules/main/pharmacy-info';
import type { BrandsField, BrandsModule } from '../../modules/catalogue/brands';
import type { TestimonialsField, TestimonialsModule } from '../../modules/catalogue/testimonials';

// Layout de test : sous-ensemble de modules catalogue (pas "team") ET
// sous-ensemble de champs sur "brands" — le cas qu'aucun des layouts
// "complet" (catalogue ou unique) ne couvre.
// kind: 'catalogue-partiel' → aucune complétude imposée par TS au-delà du
// module obligatoire (pharmacyInfo) : ModuleKey choisit librement lesquels
// des modules catalogue il prend, et avec quels champs.
export type CataloguePartielModuleKey = 'pharmacyInfo' | 'brands' | 'testimonials';

export const cataloguePartielMeta = {
	id: 'catalogue-partiel',
	kind: 'catalogue-partiel',
	orderable: true,
	supports: {
		pharmacyInfo: true,
		// Sous-ensemble volontaire : ce layout n'affiche pas "description",
		// mais la donnée reste saisissable et conservée (cf. CLAUDE.md).
		brands: { fields: ['name', 'logoUrl'] },
		testimonials: true
	}
} satisfies CataloguePartialLayoutMeta<
	CataloguePartielModuleKey,
	PharmacyInfoField | BrandsField | TestimonialsField
>;

// Forme de l'objet que l'API C# renverra pour un site utilisant ce layout :
// la donnée canonique de chaque module qu'il supporte, plus l'ordre voulu
// par le site (table SiteModule). En dur pour l'instant, comme les formes
// canoniques des modules — à dériver du contrat C#/NSwag plus tard.
export interface CataloguePartielSiteData {
	modules: SiteModuleInstance<CataloguePartielModuleKey>[];
	pharmacyInfo: PharmacyInfoModule;
	brands: BrandsModule[];
	testimonials: TestimonialsModule[];
}
