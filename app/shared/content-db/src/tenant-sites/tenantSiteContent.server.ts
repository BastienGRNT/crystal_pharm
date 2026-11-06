import type { ModuleName } from '@crystal-pharm/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { connectToContentDatabase, runAsTenant } from '../database/contentDatabase.server';
import { articles, tenantSites, type NewsSource } from '../database/contentTables';
import type { EditedSiteContent } from './resolveEditedContent';

/** Ce que le Tenant a saisi pour son site ; le reste vient de sa fiche et de son groupement. */
export type TenantSiteContent = EditedSiteContent & {
	layoutId: string;
	/** Ceux du layout choisi. */
	layoutSettings: Record<string, unknown>;
	layoutSettingsByLayoutId: Record<string, Record<string, unknown>>;
	enabledModules: ModuleName[];
	moduleOrder: ModuleName[];
	prescriptionIntroduction: string | undefined;
	newsSource: NewsSource;
	/** Les actualités, du plus récent au plus ancien. */
	articles: EditedSiteContent['articles'];
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
			moduleOrder: tenantSite.moduleOrder,
			services: tenantSite.services,
			hero: tenantSite.hero ?? undefined,
			findUs: tenantSite.findUs ?? undefined,
			brands: tenantSite.brands,
			appointment: tenantSite.appointment ?? undefined,
			onlineOrder: tenantSite.onlineOrder ?? undefined,
			onDutyPeriods: tenantSite.onDutyPeriods,
			prescriptionIntroduction: tenantSite.prescriptionIntroduction ?? undefined,
			newsSource: tenantSite.newsSource,
			articles: articleRows.map((articleRow) => ({
				title: articleRow.title,
				summary: articleRow.summary,
				publishedAt: toParisCalendarDate(articleRow.publishedAt),
				...(articleRow.image && { image: articleRow.image })
			}))
		};
	});
}

type TenantSiteContentRow = Omit<TenantSiteContent, 'prescriptionIntroduction' | 'hero' | 'findUs' | 'appointment' | 'onlineOrder'> & {
	prescriptionIntroduction: string | null;
	hero: TenantSiteContent['hero'] | null;
	findUs: TenantSiteContent['findUs'] | null;
	appointment: TenantSiteContent['appointment'] | null;
	onlineOrder: TenantSiteContent['onlineOrder'] | null;
};

/**
 * Le même contenu en une seule instruction, sans transaction explicite :
 * `content.read_tenant_site_content` pose elle-même le contexte de la Row-Level Security.
 */
export async function readTenantSiteContentInOneStatement(tenantId: string): Promise<TenantSiteContent | undefined> {
	const [row] = await connectToContentDatabase().execute<{ content: TenantSiteContentRow | null }>(
		sql`select content.read_tenant_site_content(${tenantId}::uuid) as content`
	);
	if (!row?.content) return undefined;
	const { prescriptionIntroduction, hero, findUs, appointment, onlineOrder, ...content } = row.content;
	return {
		...content,
		prescriptionIntroduction: prescriptionIntroduction ?? undefined,
		hero: hero ?? undefined,
		findUs: findUs ?? undefined,
		appointment: appointment ?? undefined,
		onlineOrder: onlineOrder ?? undefined
	};
}

// `engine/schema` attend une date sans heure (`2026-10-24`) : le jour de publication à Paris.
function toParisCalendarDate(instant: Date): string {
	return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(instant);
}
