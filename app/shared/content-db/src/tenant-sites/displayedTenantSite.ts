import { ModuleNameSchema, type ModuleName, type TenantSiteSchema } from '@crystal-pharm/schema';
import * as v from 'valibot';

// Les règles du site affiché, écrites une seule fois : `app/site` (le site en
// ligne) et `site-manager` (l'aperçu) les appliquent à leurs propres sources,
// et montrent donc le même site.

export type TenantSiteInput = v.InferInput<typeof TenantSiteSchema>;
type TenantModulesInput = TenantSiteInput['modules'];
export type ModuleDataByName = { [Name in ModuleName]: Extract<TenantModulesInput[Name], { enabled: true }>['data'] };

/** Ce qu'on sait du site, déjà lu dans chaque base ; les adresses des images sont celles du domaine qui l'affiche. */
export type DisplayedTenantSiteSources = {
	tenantId: string;
	layoutId: string;
	layoutSettings: Record<string, unknown>;
	/** Les modules que le Tenant a choisi d'afficher. */
	enabledModules: readonly ModuleName[];
	pharmacy: Omit<TenantSiteInput['pharmacy'], 'group'>;
	group: DisplayedPharmacyGroup | undefined;
	/** Les données de chaque module ; un module absent n'a pas encore de données. */
	moduleData: Partial<ModuleDataByName>;
};

export type DisplayedPharmacyGroup = {
	name: string;
	logoUrl: string | undefined;
	/** Lus dans `group-db`, qui ne connaît pas `engine/schema` : un nom qui n'est plus un module est ignoré. */
	mandatoryModules: readonly string[];
};

export type DisplayedTenantSite = {
	/** Encore à valider par `TenantSiteSchema`. */
	tenantSiteInput: TenantSiteInput;
	/** Imposés par le groupement mais sans données : masqués, à signaler. */
	unavailableMandatoryModules: ModuleName[];
};

/** Le site tel qu'il s'affiche : un module demandé (par le Tenant ou son groupement) et qui a des données. */
export function assembleDisplayedTenantSite(sources: DisplayedTenantSiteSources): DisplayedTenantSite {
	const availableModuleData = keepModuleDataWithContent(sources.moduleData);
	const mandatoryModules = readMandatoryModules(sources.group);
	const requestedModules = new Set([...sources.enabledModules, ...mandatoryModules]);
	const isDisplayed = (moduleName: ModuleName) => requestedModules.has(moduleName) && availableModuleData[moduleName] !== undefined;
	const toModule = <Name extends ModuleName>(moduleName: Name) => toToggleableModule(availableModuleData[moduleName], isDisplayed(moduleName));

	return {
		tenantSiteInput: {
			tenantId: sources.tenantId,
			layoutId: sources.layoutId,
			layoutSettings: sources.layoutSettings,
			pharmacy: {
				...sources.pharmacy,
				group: sources.group && {
					name: sources.group.name,
					logoUrl: sources.group.logoUrl,
					mandatoryModules: mandatoryModules.filter(isDisplayed)
				}
			},
			modules: {
				openingHours: toModule('openingHours'),
				team: toModule('team'),
				services: toModule('services'),
				news: toModule('news'),
				prescriptionUpload: toModule('prescriptionUpload'),
				loyaltyCard: toModule('loyaltyCard')
			}
		},
		unavailableMandatoryModules: mandatoryModules.filter((moduleName) => availableModuleData[moduleName] === undefined)
	};
}

// Une liste vide laisserait une section vide sur le site : le module compte comme sans données.
export function keepModuleDataWithContent(moduleData: Partial<ModuleDataByName>): Partial<ModuleDataByName> {
	const { team, services, news, ...modulesWithoutList } = moduleData;
	return {
		...modulesWithoutList,
		...(team && team.members.length > 0 && { team }),
		...(services && services.services.length > 0 && { services }),
		...(news && news.articles.length > 0 && { news })
	};
}

function readMandatoryModules(group: DisplayedPharmacyGroup | undefined): ModuleName[] {
	return (group?.mandatoryModules ?? []).filter((moduleName) => v.is(ModuleNameSchema, moduleName));
}

function toToggleableModule<ModuleData>(
	moduleData: ModuleData,
	isDisplayed: boolean
): { enabled: false } | { enabled: true; data: NonNullable<ModuleData> } {
	return isDisplayed && moduleData !== undefined && moduleData !== null ? { enabled: true, data: moduleData } : { enabled: false };
}
