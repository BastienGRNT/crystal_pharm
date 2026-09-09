import type { UniqueCompleteLayoutMeta } from '../../layout-module-contracts';
import type { SiteModuleInstance } from '../../module-order';
import type { PharmacyInfoField, PharmacyInfoModule } from '../../modules/main/pharmacy-info';
import type { HeroField, HeroModule } from '../../modules/unique/hero';
import type { AboutField, AboutModule } from '../../modules/unique/about';

// Layout de test : que des modules unique (+ pharmacyInfo, obligatoire
// pour tous), réordonnables par le site.
// kind: 'unique-complet' → TS exige tous les UNIQUE_MODULE_KEYS dans
// `supports` (hero, about) : en oublier un ne compile pas.
export type UniqueOrdonneModuleKey = 'pharmacyInfo' | 'hero' | 'about';

export const uniqueOrdonneMeta = {
	id: 'unique-ordonne',
	kind: 'unique-complet',
	orderable: true,
	supports: {
		pharmacyInfo: true,
		hero: true,
		about: true
	}
} satisfies UniqueCompleteLayoutMeta<UniqueOrdonneModuleKey, PharmacyInfoField | HeroField | AboutField>;

export interface UniqueOrdonneSiteData {
	modules: SiteModuleInstance<UniqueOrdonneModuleKey>[];
	pharmacyInfo: PharmacyInfoModule;
	hero: HeroModule;
	about: AboutModule;
}
