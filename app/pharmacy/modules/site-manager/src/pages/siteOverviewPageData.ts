import type { NewsSource } from '@crystal-pharm/group-db/domain';
import type { OnDutyPeriod } from '@crystal-pharm/schema';
import type { SiteTrafficSummary } from '@crystal-pharm/site-traffic-db/domain';
import type { SiteSetupStep } from '../domain/site-overview/siteSetupSteps';

export type SiteOverviewNews = {
	source: NewsSource;
	/** Le nom du groupement quand ses actualités sont celles du site. */
	groupName: string | undefined;
	isImposedByGroup: boolean;
	isShownOnSite: boolean;
	/** Les plus récentes de la source affichée. */
	latestArticles: { title: string; publishedAt: string }[];
	articleCount: number;
};

export type SiteOverviewPageData = {
	isSiteCreated: boolean;
	publicSiteUrl: string | undefined;
	/** `undefined` tant que le site n'existe pas : il n'a pas encore pu être visité. */
	traffic: SiteTrafficSummary | undefined;
	/** Les plus proches, en cours comprise. */
	upcomingOnDutyPeriods: OnDutyPeriod[];
	upcomingOnDutyPeriodCount: number;
	news: SiteOverviewNews;
	setupSteps: SiteSetupStep[];
};

export const siteOverviewPathname = '/site-manager';
export const siteEditionPathname = '/site-manager/edition';
