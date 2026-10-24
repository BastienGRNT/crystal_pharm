import { readTenantSiteContent, runAsTenant, type TenantSiteContent } from '@crystal-pharm/content-db';
import { articles, tenantSites } from '@crystal-pharm/content-db/tables';
import { findGroupSiteProfileOfTenant, type GroupSiteProfileOfTenant } from '@crystal-pharm/group-db';
import { getPharmacyProfile, listEmployees, type Employee, type PharmacyProfile } from '@crystal-pharm/pharmacy-db';
import type { ModuleName, NewsModuleData, ServicesModuleData } from '@crystal-pharm/schema';
import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';

/** Ce que l'édition lit dans chaque base pour un Tenant ; `content` est absent tant que le site n'existe pas. */
export type SiteEditorSources = {
	content: TenantSiteContent | undefined;
	pharmacyProfile: PharmacyProfile;
	employees: Employee[];
	group: GroupSiteProfileOfTenant | undefined;
};

/** Ce que le Manager enregistre, déjà validé par `engine/schema` et le layout. */
export type SiteEdition = {
	layoutId: string;
	layoutSettings: Record<string, unknown>;
	enabledModules: ModuleName[];
	services: ServicesModuleData['services'];
	/** La liste complète : celles qui n'y sont plus sont retirées du site. */
	articles: NewsModuleData['articles'];
};

export async function readSiteEditorSources(tenantId: string): Promise<SiteEditorSources> {
	const [content, pharmacyProfile, employees, group] = await Promise.all([
		readTenantSiteContent(tenantId),
		getPharmacyProfile(tenantId),
		listEmployees(tenantId),
		findGroupSiteProfileOfTenant(tenantId)
	]);
	return { content, pharmacyProfile, employees, group };
}

/** Crée le site ou le met à jour, en une transaction. Les réglages des autres layouts sont gardés. */
export async function saveSiteEdition(tenantId: string, edition: SiteEdition): Promise<void> {
	const layoutSettingsOfChosenLayout = { [edition.layoutId]: edition.layoutSettings };
	await runAsTenant(tenantId, async (transaction) => {
		await transaction
			.insert(tenantSites)
			.values({
				tenantId,
				layoutId: edition.layoutId,
				layoutSettingsByLayoutId: layoutSettingsOfChosenLayout,
				enabledModules: edition.enabledModules,
				services: edition.services
			})
			.onConflictDoUpdate({
				target: tenantSites.tenantId,
				set: {
					layoutId: edition.layoutId,
					// Fusion faite par Postgres : les réglages d'un autre layout ne sont jamais écrasés.
					layoutSettingsByLayoutId: sql`${tenantSites.layoutSettingsByLayoutId} || ${JSON.stringify(layoutSettingsOfChosenLayout)}::jsonb`,
					enabledModules: edition.enabledModules,
					services: edition.services,
					updatedAt: new Date()
				}
			});

		await transaction.delete(articles).where(eq(articles.tenantId, tenantId));
		if (edition.articles.length === 0) return;
		await transaction.insert(articles).values(
			edition.articles.map((article) => ({
				id: randomUUID(),
				tenantId,
				title: article.title,
				summary: article.summary,
				// Midi UTC : le même jour à Paris, été comme hiver.
				publishedAt: new Date(`${article.publishedAt}T12:00:00Z`)
			}))
		);
	});
}
