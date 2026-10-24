import type { ScenarioStep } from '../assembleTenantSiteInput';

export const applyLayoutSettingsOverrides: ScenarioStep = (tenantSite, scenario) => {
  const layoutSettingsOverrides = scenario.layoutSettingsOverridesByLayoutId[tenantSite.layoutId];
  if (!layoutSettingsOverrides) return tenantSite;
  return { ...tenantSite, layoutSettings: { ...tenantSite.layoutSettings, ...layoutSettingsOverrides } };
};
