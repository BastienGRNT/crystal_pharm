import {
	assembleDisplayedTenantSite,
	keepModuleDataWithContent,
	type ModuleDataByName,
	type TenantSiteInput
} from '@crystal-pharm/content-db/domain';
import { chooseDisplayedNewsSource, type NewsSource } from '@crystal-pharm/group-db/domain';
import type { ModuleName, NewsModuleData } from '@crystal-pharm/schema';
import { listCompleteArticles, listCompleteServices, type ArticleDraft, type ServiceDraft } from './siteContentLists';

export type { ModuleDataByName, TenantSiteInput };

/** Les modules saisis ici ; les autres viennent de la fiche et du groupement. */
type ModuleEditedHere = 'services' | 'news';

/** Tout ce que le Manager ne change pas ici : sa fiche, son équipe, son groupement. */
export type SiteEditorBase = {
	tenantId: string;
	pharmacy: Omit<TenantSiteInput['pharmacy'], 'group'>;
	group: SiteEditorGroup | undefined;
	/** Un module absent n'a pas encore de données : il ne peut pas s'afficher. */
	availableModuleData: Partial<Omit<ModuleDataByName, ModuleEditedHere>>;
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

/** Ce que le Manager choisit et saisit : le layout, ses réglages, les modules affichés, ses services et ses actualités. */
export type SiteDraft = {
	layoutId: string;
	layoutSettings: Record<string, unknown>;
	enabledModules: ModuleName[];
	services: ServiceDraft[];
	articles: ArticleDraft[];
	/** Le choix du Manager, gardé même quand son groupement impose les siennes. */
	newsSource: NewsSource;
};

export type SiteContentDraft = Pick<SiteDraft, 'services' | 'articles' | 'newsSource'>;

export const moduleNames: readonly ModuleName[] = [
	'openingHours',
	'team',
	'services',
	'news',
	'prescriptionUpload',
	'loyaltyCard'
];

// Les règles d'affichage sont celles du site en ligne (`content-db`) : l'aperçu montre le même site.
export function collectAvailableModuleData(base: SiteEditorBase, draft: SiteContentDraft): Partial<ModuleDataByName> {
	return keepModuleDataWithContent({
		...base.availableModuleData,
		services: { services: listCompleteServices(draft.services) },
		news: { articles: listDisplayedArticles(base, draft) }
	});
}

// Un groupement qui impose ses actualités sans en avoir publié masque le bloc : rien à montrer.
function listDisplayedArticles(base: SiteEditorBase, draft: SiteContentDraft): NewsModuleData['articles'] {
	const { source } = chooseDisplayedNewsSource(draft.newsSource, base.group);
	return source === 'group' ? (base.group?.articles ?? []) : listCompleteArticles(draft.articles);
}

/** Les modules imposés par le groupement qu'on peut afficher ; les autres sont signalés au Manager. */
export function listDisplayableMandatoryModules(base: SiteEditorBase, availableModuleData: Partial<ModuleDataByName>): ModuleName[] {
	return (base.group?.mandatoryModules ?? []).filter((moduleName) => availableModuleData[moduleName] !== undefined);
}

/** Le site tel qu'il sera affiché, encore à valider par `TenantSiteSchema`. */
export function toTenantSiteInput(base: SiteEditorBase, draft: SiteDraft): TenantSiteInput {
	return assembleDisplayedTenantSite({
		tenantId: base.tenantId,
		layoutId: draft.layoutId,
		layoutSettings: draft.layoutSettings,
		enabledModules: draft.enabledModules,
		pharmacy: base.pharmacy,
		group: base.group && { name: base.group.name, logoUrl: base.group.logoUrl, mandatoryModules: base.group.mandatoryModules },
		moduleData: collectAvailableModuleData(base, draft)
	}).tenantSiteInput;
}
