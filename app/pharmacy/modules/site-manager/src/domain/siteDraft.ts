import {
	assembleDisplayedTenantSite,
	keepModuleDataWithContent,
	resolveEditedContent,
	type ModuleDataByName,
	type ResolvedEditedContent,
	type TenantSiteInput
} from '@crystal-pharm/content-db/domain';
import { chooseDisplayedNewsSource, type NewsSource } from '@crystal-pharm/group-db/domain';
import type { ModuleName, NewsModuleData, OpeningHoursSectionData } from '@crystal-pharm/schema';
import { listCompleteArticles, listCompleteBrands, listCompleteServices, type ArticleDraft, type BrandDraft, type ServiceDraft } from './siteContentLists';
import { createPreviewImageResolver } from './siteImageChoices';
import { toStoredSections, type SectionDrafts } from './siteSectionDrafts';

export type { ModuleDataByName, TenantSiteInput };

/** Les modules saisis ici ; les autres viennent de la fiche et du groupement. */
type ModuleEditedHere = 'services' | 'news' | 'brands' | 'appointment' | 'onlineOrder';

/** Tout ce que le Manager ne change pas ici : sa fiche, son équipe, son groupement. */
export type SiteEditorBase = {
	tenantId: string;
	pharmacy: Omit<TenantSiteInput['pharmacy'], 'group'>;
	group: SiteEditorGroup | undefined;
	/** Les horaires viennent de la fiche ; sans horaires saisis, le site montre une semaine fermée. */
	openingHours: OpeningHoursSectionData | undefined;
	/** Un module absent n'a pas encore de données : il ne peut pas s'afficher. */
	availableModuleData: Partial<Omit<ModuleDataByName, ModuleEditedHere>>;
	/** Les adresses signées de l'aperçu pour chaque image envoyée, par identifiant. */
	uploadedImagePreviewUrls: Record<string, string>;
};

export type SiteEditorGroup = {
	name: string;
	logoUrl?: string;
	mandatoryModules: ModuleName[];
	/** S'il impose ses actualités, le choix du Manager ne compte plus. */
	imposesGroupNews: boolean;
	/** Du plus récent au plus ancien. */
	articles: NewsModuleData['articles'];
};

/** Ce que le Manager choisit et saisit : le layout, ses réglages, les modules affichés et leur ordre, et son contenu. */
export type SiteDraft = {
	layoutId: string;
	layoutSettings: Record<string, unknown>;
	enabledModules: ModuleName[];
	moduleOrder: ModuleName[];
	sections: SectionDrafts;
	services: ServiceDraft[];
	brands: BrandDraft[];
	articles: ArticleDraft[];
	/** Le choix du Manager, gardé même quand son groupement impose les siennes. */
	newsSource: NewsSource;
};

export type SiteContentDraft = Pick<SiteDraft, 'sections' | 'services' | 'brands' | 'articles' | 'newsSource'>;

// Les règles d'affichage sont celles du site en ligne (`content-db`) : l'aperçu montre le même site.
export function collectAvailableModuleData(base: SiteEditorBase, draft: SiteContentDraft): Partial<ModuleDataByName> {
	return toModuleData(base, draft, resolveDraftContent(base, draft));
}

function resolveDraftContent(base: SiteEditorBase, draft: SiteContentDraft): ResolvedEditedContent {
	const { hero, findUs, appointment, onlineOrder } = toStoredSections(draft.sections);
	return resolveEditedContent(
		{
			hero,
			findUs,
			appointment,
			onlineOrder,
			services: listCompleteServices(draft.services),
			brands: listCompleteBrands(draft.brands),
			articles: listCompleteArticles(draft.articles)
		},
		createPreviewImageResolver(base.uploadedImagePreviewUrls)
	);
}

function toModuleData(base: SiteEditorBase, draft: SiteContentDraft, resolvedContent: ResolvedEditedContent): Partial<ModuleDataByName> {
	return keepModuleDataWithContent({
		...base.availableModuleData,
		services: { services: resolvedContent.services },
		brands: { brands: resolvedContent.brands },
		news: { articles: listDisplayedArticles(base, draft, resolvedContent) },
		...(resolvedContent.appointment && { appointment: resolvedContent.appointment }),
		...(resolvedContent.onlineOrder && { onlineOrder: resolvedContent.onlineOrder })
	});
}

// Un groupement qui impose ses actualités sans en avoir publié masque le bloc : rien à montrer.
function listDisplayedArticles(base: SiteEditorBase, draft: SiteContentDraft, resolvedContent: ResolvedEditedContent): NewsModuleData['articles'] {
	const { source } = chooseDisplayedNewsSource(draft.newsSource, base.group);
	return source === 'group' ? (base.group?.articles ?? []) : resolvedContent.articles;
}

/** Le site tel qu'il sera affiché, encore à valider par `TenantSiteSchema`. */
export function toTenantSiteInput(base: SiteEditorBase, draft: SiteDraft): TenantSiteInput {
	const resolvedContent = resolveDraftContent(base, draft);
	return assembleDisplayedTenantSite({
		tenantId: base.tenantId,
		layoutId: draft.layoutId,
		layoutSettings: draft.layoutSettings,
		enabledModules: draft.enabledModules,
		moduleOrder: draft.moduleOrder,
		pharmacy: base.pharmacy,
		fixedSections: { hero: resolvedContent.hero, findUs: resolvedContent.findUs, openingHours: base.openingHours },
		group: base.group && { name: base.group.name, logoUrl: base.group.logoUrl, mandatoryModules: base.group.mandatoryModules },
		moduleData: toModuleData(base, draft, resolvedContent)
	}).tenantSiteInput;
}
