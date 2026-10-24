import { ModuleNameSchema, type ModuleName } from '@crystal-pharm/schema';
import type { ModuleOverride } from '../../../shared/PlaygroundScenario';
import type { TenantSiteInput } from '../../mocks/MockTenant';
import { createSampleModuleData } from '../../mocks/sampleModuleData';
import type { ScenarioStep } from '../assembleTenantSiteInput';

type TenantModulesInput = TenantSiteInput['modules'];

/**
 * Un module imposé par le groupement est activé d'office, comme le ferait l'outil de la pharmacie.
 * Le désactiver explicitement depuis le panneau reste possible : c'est ainsi qu'on vérifie que le schéma le refuse.
 */
export const applyModuleOverrides: ScenarioStep = (tenantSite, scenario) => {
  const mandatoryModules = tenantSite.pharmacy.group?.mandatoryModules ?? [];
  const sampleModuleData = createSampleModuleData();
  const modules = Object.fromEntries(
    ModuleNameSchema.options.map((moduleName) => {
      const override = scenario.moduleOverrides[moduleName] ?? (mandatoryModules.includes(moduleName) ? 'enabled' : undefined);
      return [moduleName, resolveModule(tenantSite.modules[moduleName], override, sampleModuleData[moduleName])];
    }),
    // `Object.fromEntries` perd le lien entre chaque clé et le type de son module ; il est garanti par `createSampleModuleData`.
  ) as TenantModulesInput;
  return { ...tenantSite, modules };
};

function resolveModule(
  currentModule: TenantModulesInput[ModuleName],
  override: ModuleOverride | undefined,
  sampleData: ReturnType<typeof createSampleModuleData>[ModuleName],
): TenantModulesInput[ModuleName] | { enabled: true; data: typeof sampleData } {
  if (override === 'disabled') return { enabled: false };
  if (override === 'enabled' && !currentModule.enabled) return { enabled: true, data: sampleData };
  return currentModule;
}
