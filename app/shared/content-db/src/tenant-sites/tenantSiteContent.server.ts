import type { ModuleName, NewsModuleData, ServicesModuleData } from '@crystal-pharm/schema';
import { desc, eq } from 'drizzle-orm';
import { runAsTenant } from '../database/contentDatabase.server';
import { articles, tenantSites } from '../database/contentTables';

/** Ce que le Tenant a saisi pour son site ; le reste vient de sa fiche et de son groupement. */
export type TenantSiteContent = {
	layoutId: string;
	/** Ceux du layout choisi. */
	layoutSettings: Record<string, unknown>;
	layoutSettingsByLayoutId: Record<string, Record<string, unknown>>;
	enabledModules: ModuleName[];
	services: ServicesModuleData['services'];
	prescriptionIntroduction: string | undefined;
	/** Du plus récent au plus ancien. */
	articles: NewsModuleData['articles'];
};

/** `undefined` tant que le Tenant n'a pas créé son site. */
export async function readTenantSiteContent(tenantId: string): Promise<TenantSiteContent | undefined> {
	return runAsTenant(tenantId, async (transaction) => {
		const [tenantSite] = await transaction.select().from(tenantSites).where(eq(tenantSites.tenantId, tenantId));
		if (!tenantSite) return undefined;

		const articleRows = await transaction
			.select()
			.from(articles)
			.where(eq(articles.tenantId, tenantId))
			.orderBy(desc(articles.publishedAt));

		return {
			layoutId: tenantSite.layoutId,
			layoutSettings: tenantSite.layoutSettingsByLayoutId[tenantSite.layoutId] ?? {},
			layoutSettingsByLayoutId: tenantSite.layoutSettingsByLayoutId,
			enabledModules: tenantSite.enabledModules,
			services: tenantSite.services,
			prescriptionIntroduction: tenantSite.prescriptionIntroduction ?? undefined,
			articles: articleRows.map((articleRow) => ({
				title: articleRow.title,
				summary: articleRow.summary,
				publishedAt: toParisCalendarDate(articleRow.publishedAt)
			}))
		};
	});
}

// `engine/schema` attend une date sans heure (`2026-10-24`) : le jour de publication à Paris.
function toParisCalendarDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(instant);
}
