import type { PlaygroundScenario } from '../../shared/PlaygroundScenario';
import { findMockTenant } from '../mocks/allMockTenants';
import type { TenantSiteInput } from '../mocks/MockTenant';
import { applyGroupChoice } from './steps/applyGroupChoice';
import { applyLayoutChoice } from './steps/applyLayoutChoice';
import { applyLayoutSettingsOverrides } from './steps/applyLayoutSettingsOverrides';
import { applyModuleOverrides } from './steps/applyModuleOverrides';
import { applyOnDutyChoice } from './steps/applyOnDutyChoice';
import { emptyListsIfAsked } from './steps/emptyListsIfAsked';
import { lengthenTextsIfAsked } from './steps/lengthenTextsIfAsked';
import { removeImagesIfAsked } from './steps/removeImagesIfAsked';

export type ScenarioStep = (tenantSite: TenantSiteInput, scenario: PlaygroundScenario) => TenantSiteInput;

/** Dans cet ordre : le groupement choisi décide des modules imposés, que les étapes suivantes respectent. */
const scenarioSteps: readonly ScenarioStep[] = [
  applyLayoutChoice,
  applyGroupChoice,
  applyModuleOverrides,
  applyOnDutyChoice,
  emptyListsIfAsked,
  lengthenTextsIfAsked,
  removeImagesIfAsked,
  applyLayoutSettingsOverrides,
];

/**
 * Le TenantSite que le scénario décrit, encore brut : la validation par `TenantSiteSchema` vient après,
 * comme pour des données reçues de l'API. Des données éditées à la main sont rendues telles quelles.
 */
export function assembleTenantSiteInput(scenario: PlaygroundScenario): unknown {
  if (scenario.editedTenantSite !== undefined) return scenario.editedTenantSite;
  const mockTenant = findMockTenant(scenario.mockTenantId);
  if (!mockTenant) throw new Error(`Aucun mock pour la pharmacie « ${scenario.mockTenantId} ».`);
  // Une copie : les étapes ne doivent jamais toucher les constantes partagées entre mocks (horaires, groupements…).
  const startingTenantSite = structuredClone(mockTenant.createTenantSite());
  return scenarioSteps.reduce((tenantSite, step) => step(tenantSite, scenario), startingTenantSite);
}
