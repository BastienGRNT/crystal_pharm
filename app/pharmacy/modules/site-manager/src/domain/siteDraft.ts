import type { ModuleName, TenantSiteSchema } from '@crystal-pharm/schema';
import type * as v from 'valibot';
import { listCompleteArticles, listCompleteServices, type ArticleDraft, type ServiceDraft } from './siteContentLists';

export type TenantSiteInput = v.InferInput<typeof TenantSiteSchema>;
type TenantModulesInput = TenantSiteInput['modules'];
export type ModuleDataByName = {
	[Name in ModuleName]: Extract<TenantModulesInput[Name], { enabled: true }>['data'];
};

/** Les modules saisis ici ; les autres viennent de la fiche et du groupement. */
type ModuleEditedHere = 'services' | 'news';

/** Tout ce que le Manager ne change pas ici : sa fiche, son équipe, son groupement. */
export type SiteEditorBase = {
	tenantId: string;
	pharmacy: Omit<TenantSiteInput['pharmacy'], 'group'>;
	group: { name: string; logoUrl?: string; mandatoryModules: ModuleName[] } | undefined;
	/** Un module absent n'a pas encore de données : il ne peut pas s'afficher. */
	availableModuleData: Partial<Omit<ModuleDataByName, ModuleEditedHere>>;
};

/** Ce que le Manager choisit et saisit : le layout, ses réglages, les modules affichés, ses services et ses actualités. */
export type SiteDraft = {
	layoutId: string;
	layoutSettings: Record<string, unknown>;
	enabledModules: ModuleName[];
	services: ServiceDraft[];
	articles: ArticleDraft[];
};

export const moduleNames: readonly ModuleName[] = [
	'openingHours',
	'team',
	'services',
	'news',
	'prescriptionUpload',
	'loyaltyCard'
];

// Une liste vide ne s'affiche pas : un module sans contenu laisserait une section vide sur le site.
export function collectAvailableModuleData(base: SiteEditorBase, draft: Pick<SiteDraft, 'services' | 'articles'>): Partial<ModuleDataByName> {
	const services = listCompleteServices(draft.services);
	const articles = listCompleteArticles(draft.articles);
	return {
		...base.availableModuleData,
		...(services.length > 0 && { services: { services } }),
		...(articles.length > 0 && { news: { articles } })
	};
}

/** Les modules imposés par le groupement qu'on peut afficher ; les autres sont signalés au Manager. */
export function listDisplayableMandatoryModules(base: SiteEditorBase, availableModuleData: Partial<ModuleDataByName>): ModuleName[] {
	return (base.group?.mandatoryModules ?? []).filter((moduleName) => availableModuleData[moduleName] !== undefined);
}

/** Le site tel qu'il sera affiché, encore à valider par `TenantSiteSchema`. */
export function toTenantSiteInput(base: SiteEditorBase, draft: SiteDraft): TenantSiteInput {
	const availableModuleData = collectAvailableModuleData(base, draft);
	const displayableMandatoryModules = listDisplayableMandatoryModules(base, availableModuleData);
	const requestedModules = new Set([...draft.enabledModules, ...displayableMandatoryModules]);
	const toModule = <Name extends ModuleName>(moduleName: Name) =>
		toToggleableModule(availableModuleData[moduleName], requestedModules.has(moduleName));
	return {
		tenantId: base.tenantId,
		layoutId: draft.layoutId,
		layoutSettings: draft.layoutSettings,
		pharmacy: {
			...base.pharmacy,
			group: base.group && { ...base.group, mandatoryModules: displayableMandatoryModules }
		},
		modules: {
			openingHours: toModule('openingHours'),
			team: toModule('team'),
			services: toModule('services'),
			news: toModule('news'),
			prescriptionUpload: toModule('prescriptionUpload'),
			loyaltyCard: toModule('loyaltyCard')
		}
	};
}

function toToggleableModule<ModuleData>(
	moduleData: ModuleData,
	isRequested: boolean
): { enabled: false } | { enabled: true; data: NonNullable<ModuleData> } {
	return isRequested && moduleData !== undefined && moduleData !== null ? { enabled: true, data: moduleData } : { enabled: false };
}
