import { recordPageViews, type PageViewCount } from '@crystal-pharm/site-traffic-db';
import { siteTrafficDayCount, toHourStart } from '@crystal-pharm/site-traffic-db/domain';

const millisecondsInHour = 3_600_000;
const pagesWithShareOfViews = [
	{ pagePath: '/', share: 0.62 },
	{ pagePath: '/ordonnance', share: 0.26 },
	{ pagePath: '/equipe', share: 0.12 }
];
// Les visites d'une pharmacie de quartier : le matin, le midi et la sortie du travail.
const visitsByHour: Record<number, number> = { 7: 1, 8: 4, 9: 7, 10: 6, 11: 5, 12: 8, 13: 6, 14: 3, 15: 3, 16: 4, 17: 7, 18: 9, 19: 6, 20: 3, 21: 2 };
// 0 = lundi : le samedi matin est chargé, le dimanche presque vide.
const busynessByWeekday = [1.1, 0.9, 1, 0.95, 1.15, 1.3, 0.25];
const viewsPerVisit = 2.3;

/** Un mois de visites sur le site de démo, qui monte un peu : de quoi voir le graphique et la tendance. */
export async function seedDemoSiteTraffic(tenantId: string, now = new Date()): Promise<number> {
	const pageViewCounts = listDemoPageViewCounts(tenantId, now);
	await recordPageViews(pageViewCounts);
	return pageViewCounts.reduce((total, pageViewCount) => total + pageViewCount.visitCount, 0);
}

function listDemoPageViewCounts(tenantId: string, now: Date): PageViewCount[] {
	const pageViewCounts: PageViewCount[] = [];
	const currentHourStart = toHourStart(now).getTime();
	const hourCount = siteTrafficDayCount * 24;
	for (let hoursAgo = 0; hoursAgo < hourCount; hoursAgo += 1) {
		const hourStart = new Date(currentHourStart - hoursAgo * millisecondsInHour);
		const visitCount = demoVisitCountAt(hourStart, hoursAgo / hourCount);
		if (visitCount === 0) continue;
		for (const { pagePath, share } of pagesWithShareOfViews) {
			const visitCountOfPage = Math.round(visitCount * share);
			const viewCount = Math.round(visitCount * viewsPerVisit * share);
			if (viewCount > 0) pageViewCounts.push({ tenantId, hourStart, pagePath, viewCount, visitCount: visitCountOfPage });
		}
	}
	return pageViewCounts;
}

function demoVisitCountAt(hourStart: Date, shareOfPeriodAgo: number): number {
	const parisTime = new Date(hourStart.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
	const weekday = (parisTime.getDay() + 6) % 7;
	const visitsAtThisHour = visitsByHour[parisTime.getHours()] ?? 0;
	const growth = 1.25 - shareOfPeriodAgo * 0.5;
	return Math.round(visitsAtThisHour * (busynessByWeekday[weekday] ?? 1) * growth * jitterOf(hourStart));
}

// Toujours le même tirage pour une heure donnée : deux réinitialisations montrent les mêmes courbes.
function jitterOf(hourStart: Date): number {
	const pseudoRandom = Math.sin(hourStart.getTime() / millisecondsInHour) * 10_000;
	return 0.7 + (pseudoRandom - Math.floor(pseudoRandom)) * 0.6;
}
