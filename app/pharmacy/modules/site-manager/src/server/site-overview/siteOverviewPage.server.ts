import type { AuthenticatedUser } from '@crystal-pharm/auth';
import { chooseDisplayedNewsSource } from '@crystal-pharm/group-db/domain';
import { readSiteTraffic } from '@crystal-pharm/site-traffic-db';
import { siteTrafficTimeZone, summarizeSiteTraffic, type SiteTrafficSummary } from '@crystal-pharm/site-traffic-db/domain';
import { keepUpcomingPeriods } from '../../domain/onDutyPeriods';
import { listSiteSetupSteps } from '../../domain/site-overview/siteSetupSteps';
import { siteAddressPathname } from '../../pages/siteEditorPageData';
import { siteEditionPathname, type SiteOverviewNews, type SiteOverviewPageData } from '../../pages/siteOverviewPageData';
import { requireActiveTenantId } from '../activeTenant.server';
import { readSiteEditorSources, type SiteEditorSources } from '../repositories/tenantSiteRepository.server';
import { readPublicSiteUrlOfTenant } from '../site-address/siteAddress.server';

type SiteOverviewRequest = { locals: { user: AuthenticatedUser | null } };

const shownOnDutyPeriodCount = 3;
const shownArticleCount = 3;

export async function loadSiteOverviewPage({ locals }: SiteOverviewRequest): Promise<SiteOverviewPageData> {
	const tenantId = await requireActiveTenantId(locals.user);
	const now = new Date();
	const [sources, publicSiteUrl, traffic] = await Promise.all([
		readSiteEditorSources(tenantId),
		readPublicSiteUrlOfTenant(tenantId),
		readTrafficSummary(tenantId, now)
	]);
	const upcomingOnDutyPeriods = keepUpcomingPeriods(sources.content?.onDutyPeriods ?? [], now);
	const news = summarizeNews(sources);
	return {
		isSiteCreated: sources.content !== undefined,
		publicSiteUrl,
		traffic: sources.content ? traffic : undefined,
		upcomingOnDutyPeriods: upcomingOnDutyPeriods.slice(0, shownOnDutyPeriodCount),
		upcomingOnDutyPeriodCount: upcomingOnDutyPeriods.length,
		news,
		setupSteps: listSiteSetupSteps(
			{
				isSiteOnline: sources.content !== undefined && publicSiteUrl !== undefined,
				hasHeroImage: sources.content?.hero?.image !== undefined,
				serviceCount: sources.content?.services.length ?? 0,
				shownArticleCount: news.isShownOnSite ? news.articleCount : 0,
				hasOpeningHours: sources.pharmacyProfile.weeklyOpeningSchedule !== undefined,
				employeeCount: sources.employees.length
			},
			// Sans site, il n'y a pas d'adresse à choisir : la mise en ligne passe par le premier enregistrement.
			{ siteAddress: sources.content ? siteAddressPathname : siteEditionPathname, siteEdition: siteEditionPathname }
		)
	};
}

async function readTrafficSummary(tenantId: string, now: Date): Promise<SiteTrafficSummary> {
	const today = new Intl.DateTimeFormat('en-CA', { timeZone: siteTrafficTimeZone }).format(now);
	return summarizeSiteTraffic(await readSiteTraffic(tenantId, now), today);
}

function summarizeNews({ content, group }: SiteEditorSources): SiteOverviewNews {
	const { source, isImposedByGroup } = chooseDisplayedNewsSource(content?.newsSource ?? 'pharmacy', group);
	const articles = source === 'group' ? (group?.articles ?? []) : (content?.articles ?? []);
	return {
		source,
		groupName: source === 'group' ? group?.name : undefined,
		isImposedByGroup,
		isShownOnSite: content?.enabledModules.includes('news') ?? false,
		latestArticles: articles.slice(0, shownArticleCount).map(({ title, publishedAt }) => ({ title, publishedAt })),
		articleCount: articles.length
	};
}
