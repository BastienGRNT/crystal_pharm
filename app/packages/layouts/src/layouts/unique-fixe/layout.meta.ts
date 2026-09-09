import type { UniqueCompleteLayoutMeta } from '../../layout-module-contracts';
import type { SiteModuleInstance } from '../../module-order';
import type { PharmacyInfoField, PharmacyInfoModule } from '../../modules/main/pharmacy-info';
import type { HeroField, HeroModule } from '../../modules/unique/hero';
import type { AboutField, AboutModule } from '../../modules/unique/about';

// Layout de test : que des modules unique (+ pharmacyInfo, obligatoire
// pour tous), ordre fixé par le layout (le site ne peut pas les réordonner).
// kind: 'unique-complet' → TS exige tous les UNIQUE_MODULE_KEYS dans
// `supports` (hero, about) : en oublier un ne compile pas.
export type UniqueFixeModuleKey = 'pharmacyInfo' | 'hero' | 'about';

export const uniqueFixeMeta = {
	id: 'unique-fixe',
	kind: 'unique-complet',
	orderable: false,
	supports: {
		pharmacyInfo: true,
		hero: true,
		about: true
	}
} satisfies UniqueCompleteLayoutMeta<UniqueFixeModuleKey, PharmacyInfoField | HeroField | AboutField>;

export interface UniqueFixeSiteData {
	modules: SiteModuleInstance<UniqueFixeModuleKey>[];
	pharmacyInfo: PharmacyInfoModule;
	hero: HeroModule;
	about: AboutModule;
}
