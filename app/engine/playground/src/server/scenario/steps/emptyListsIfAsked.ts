import type { ScenarioStep } from '../assembleTenantSiteInput';
import { mapEnabledModuleData } from '../mapEnabledModuleData';

/** Un module activé mais sans contenu : le layout doit le gérer sans afficher une section vide ou cassée. */
export const emptyListsIfAsked: ScenarioStep = (tenantSite, scenario) => {
  if (!scenario.withEmptyLists) return tenantSite;
  const { modules, fixedSections } = tenantSite;
  return {
    ...tenantSite,
    fixedSections: { ...fixedSections, openingHours: { ...fixedSections.openingHours, onDutyPeriods: [] } },
    modules: {
      ...modules,
      team: mapEnabledModuleData(modules.team, () => ({ members: [] })),
      services: mapEnabledModuleData(modules.services, () => ({ services: [] })),
      news: mapEnabledModuleData(modules.news, () => ({ articles: [] })),
      brands: mapEnabledModuleData(modules.brands, () => ({ brands: [] })),
    },
  };
};
