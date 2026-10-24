import type { ScenarioStep } from '../assembleTenantSiteInput';

/** Les réglages du mock ne valent que pour son propre layout : un autre layout part de ses valeurs par défaut. */
export const applyLayoutChoice: ScenarioStep = (tenantSite, scenario) => {
  if (scenario.layoutId === undefined || scenario.layoutId === tenantSite.layoutId) return tenantSite;
  return { ...tenantSite, layoutId: scenario.layoutId, layoutSettings: {} };
};
