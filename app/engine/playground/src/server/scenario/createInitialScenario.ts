import { createNeutralScenario, type PlaygroundScenario } from '../../shared/PlaygroundScenario';
import { allMockTenants } from '../mocks/allMockTenants';

/** Avant que le panneau n'envoie son scénario : la première pharmacie, telle quelle. */
export function createInitialScenario(): PlaygroundScenario {
  const firstMockTenant = allMockTenants[0];
  if (!firstMockTenant) throw new Error('Le banc d’essai n’a aucun mock de pharmacie.');
  return createNeutralScenario(firstMockTenant.createTenantSite().tenantId);
}
