import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { runAsTenant } from '../database/siteTrafficDatabase.server';
import { hourlyPageViews } from '../database/siteTrafficTables';
import { siteTrafficDayCount, siteTrafficTimeZone, type SiteTrafficReading } from './siteTrafficSummary';

/** Les vues d'une page pendant une heure, déjà additionnées par celui qui les compte. */
export type PageViewCount = { tenantId: string; hourStart: Date; pagePath: string; viewCount: number; visitCount: number };

const mostViewedPageCount = 5;

/** Ajoute les vues aux compteurs : une transaction par Tenant, la Row-Level Security n'en laisse voir qu'un. */
export async function recordPageViews(pageViewCounts: readonly PageViewCount[]): Promise<void> {
	for (const [tenantId, countsOfTenant] of groupByTenant(pageViewCounts)) {
		await runAsTenant(tenantId, (transaction) =>
			transaction
				.insert(hourlyPageViews)
				.values(countsOfTenant)
				.onConflictDoUpdate({
					target: [hourlyPageViews.tenantId, hourlyPageViews.hourStart, hourlyPageViews.pagePath],
					set: {
						viewCount: sql`${hourlyPageViews.viewCount} + excluded.view_count`,
						visitCount: sql`${hourlyPageViews.visitCount} + excluded.visit_count`
					}
				})
		);
	}
}

function groupByTenant(pageViewCounts: readonly PageViewCount[]): Map<string, PageViewCount[]> {
	const countsByTenantId = new Map<string, PageViewCount[]>();
	for (const pageViewCount of pageViewCounts) {
		countsByTenantId.set(pageViewCount.tenantId, [...(countsByTenantId.get(pageViewCount.tenantId) ?? []), pageViewCount]);
	}
	return countsByTenantId;
}

/** Les vues du site sur la période montrée (cf. `summarizeSiteTraffic`), en heure de la pharmacie. */
export function readSiteTraffic(tenantId: string, now = new Date()): Promise<SiteTrafficReading> {
	// Écrit en clair, pas en paramètre : Postgres ne reconnaîtrait pas le même regroupement dans le select et le group by.
	const timeZone = sql.raw(`'${siteTrafficTimeZone}'`);
	const localHour = sql`(${hourlyPageViews.hourStart} at time zone ${timeZone})`;
	const periodStart = sql`((date_trunc('day', ${now.toISOString()}::timestamptz at time zone ${timeZone}) - ${`${siteTrafficDayCount - 1} days`}::interval) at time zone ${timeZone})`;
	const isInPeriod = and(eq(hourlyPageViews.tenantId, tenantId), gte(hourlyPageViews.hourStart, periodStart));
	const day = sql<string>`to_char(${localHour}, 'YYYY-MM-DD')`;
	const weekday = sql<number>`(extract(isodow from ${localHour}) - 1)::int`;
	const hour = sql<number>`extract(hour from ${localHour})::int`;
	const viewCount = sql<number>`sum(${hourlyPageViews.viewCount})::int`;
	const visitCount = sql<number>`sum(${hourlyPageViews.visitCount})::int`;

	return runAsTenant(tenantId, async (transaction) => {
		const [dailyTraffic, hourlyBusyness, mostViewedPages] = await Promise.all([
			transaction.select({ day, viewCount, visitCount }).from(hourlyPageViews).where(isInPeriod).groupBy(day),
			transaction.select({ weekday, hour, visitCount }).from(hourlyPageViews).where(isInPeriod).groupBy(weekday, hour),
			transaction
				.select({ pagePath: hourlyPageViews.pagePath, viewCount })
				.from(hourlyPageViews)
				.where(isInPeriod)
				.groupBy(hourlyPageViews.pagePath)
				.orderBy(desc(viewCount), hourlyPageViews.pagePath)
				.limit(mostViewedPageCount)
		]);
		return { dailyTraffic, hourlyBusyness, mostViewedPages };
	});
}

export async function deleteSiteTrafficOfTenant(tenantId: string): Promise<void> {
	await runAsTenant(tenantId, (transaction) => transaction.delete(hourlyPageViews).where(eq(hourlyPageViews.tenantId, tenantId)));
}
