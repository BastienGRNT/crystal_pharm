import type {
	AppointmentModuleData,
	BrandsModuleData,
	FindUsSectionData,
	HeroSectionData,
	NewsModuleData,
	OnDutyPeriod,
	OnlineOrderModuleData,
	ServicesModuleData
} from '@crystal-pharm/schema';
import { resolveSiteImageUrl, type SiteImageUrlResolver } from './siteImage';
import type {
	StoredAppointment,
	StoredArticle,
	StoredBrand,
	StoredFindUs,
	StoredHero,
	StoredOnDutyPeriod,
	StoredOnlineOrder,
	StoredService
} from './storedSiteContent';

/** Ce que le Tenant saisit lui-même sur son site, tel qu'enregistré (images en choix). */
export type EditedSiteContent = {
	hero: StoredHero | undefined;
	findUs: StoredFindUs | undefined;
	services: StoredService[];
	brands: StoredBrand[];
	articles: StoredArticle[];
	appointment: StoredAppointment | undefined;
	onlineOrder: StoredOnlineOrder | undefined;
	onDutyPeriods: StoredOnDutyPeriod[];
};

/** La même saisie, prête pour `engine/schema` : chaque image devient une adresse du domaine qui affiche le site. */
export type ResolvedEditedContent = {
	hero: HeroSectionData;
	findUs: FindUsSectionData;
	services: ServicesModuleData['services'];
	brands: BrandsModuleData['brands'];
	articles: NewsModuleData['articles'];
	appointment: AppointmentModuleData | undefined;
	onlineOrder: OnlineOrderModuleData | undefined;
	onDutyPeriods: OnDutyPeriod[];
};

export function resolveEditedContent(content: EditedSiteContent, resolver: SiteImageUrlResolver): ResolvedEditedContent {
	return {
		hero: {
			...(content.hero?.headline && { headline: content.hero.headline }),
			...withUrl('imageUrl', resolveSiteImageUrl(content.hero?.image, resolver))
		},
		findUs: content.findUs ?? {},
		services: content.services.map(({ icon, ...service }) => ({ ...service, ...withUrl('iconUrl', resolveSiteImageUrl(icon, resolver)) })),
		brands: content.brands.map(({ logo, ...brand }) => ({ ...brand, ...withUrl('logoUrl', resolveSiteImageUrl(logo, resolver)) })),
		articles: content.articles.map(({ image, ...article }) => ({ ...article, ...withUrl('imageUrl', resolveSiteImageUrl(image, resolver)) })),
		appointment: content.appointment,
		onlineOrder: content.onlineOrder,
		onDutyPeriods: content.onDutyPeriods
	};
}

function withUrl<Key extends string>(key: Key, url: string | undefined): { [K in Key]?: string } {
	return url === undefined ? {} : ({ [key]: url } as { [K in Key]?: string });
}
