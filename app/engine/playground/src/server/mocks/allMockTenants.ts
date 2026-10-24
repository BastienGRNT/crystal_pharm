import type { MockTenant } from './MockTenant';
import { grandePharmacieDeLaPlace } from './tenants/grandePharmacieDeLaPlace';
import { pharmacieDesTilleuls } from './tenants/pharmacieDesTilleuls';
import { pharmacieDupont } from './tenants/pharmacieDupont';
import { pharmacieDuPort } from './tenants/pharmacieDuPort';
import { pharmacieLumiere } from './tenants/pharmacieLumiere';
import { pharmacieSaintRoch } from './tenants/pharmacieSaintRoch';

/** Dans l'ordre du panneau : le premier est celui qu'on voit au premier lancement. */
export const allMockTenants: readonly MockTenant[] = [
  pharmacieDupont,
  pharmacieDesTilleuls,
  grandePharmacieDeLaPlace,
  pharmacieDuPort,
  pharmacieLumiere,
  pharmacieSaintRoch,
];

export function findMockTenant(tenantId: string): MockTenant | undefined {
  return allMockTenants.find((mockTenant) => mockTenant.createTenantSite().tenantId === tenantId);
}
