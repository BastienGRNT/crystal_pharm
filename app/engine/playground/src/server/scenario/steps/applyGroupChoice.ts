import { fromMockChoice, withoutGroupChoice } from '../../../shared/PlaygroundScenario';
import { demoPharmacyGroups } from '../../mocks/demoPharmacyGroups';
import type { ScenarioStep } from '../assembleTenantSiteInput';

export const applyGroupChoice: ScenarioStep = (tenantSite, scenario) => {
  if (scenario.groupChoice === fromMockChoice) return tenantSite;
  if (scenario.groupChoice === withoutGroupChoice) return { ...tenantSite, pharmacy: { ...tenantSite.pharmacy, group: undefined } };

  const demoPharmacyGroup = demoPharmacyGroups.find((candidate) => candidate.groupId === scenario.groupChoice);
  if (!demoPharmacyGroup) throw new Error(`Groupement de démonstration inconnu : « ${scenario.groupChoice} ».`);
  return { ...tenantSite, pharmacy: { ...tenantSite.pharmacy, group: structuredClone(demoPharmacyGroup.group) } };
};
