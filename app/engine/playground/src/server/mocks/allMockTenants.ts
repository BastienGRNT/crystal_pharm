import type { MockTenant } from './MockTenant';
import { grandePharmacieDeLaPlace } from './tenants/grandePharmacieDeLaPlace';
import { pharmacieDeLaGare } from './tenants/pharmacieDeLaGare';
import { pharmacieDesArcades } from './tenants/pharmacieDesArcades';
import { pharmacieDesQuais } from './tenants/pharmacieDesQuais';
import { pharmacieDesTilleuls } from './tenants/pharmacieDesTilleuls';
import { pharmacieDuBeffroi } from './tenants/pharmacieDuBeffroi';
import { pharmacieDupont } from './tenants/pharmacieDupont';
import { pharmacieDuPort } from './tenants/pharmacieDuPort';
import { pharmacieDuVieuxMarche } from './tenants/pharmacieDuVieuxMarche';
import { pharmacieLumiere } from './tenants/pharmacieLumiere';
import { pharmacieRiviere } from './tenants/pharmacieRiviere';
import { pharmacieSainteClaire } from './tenants/pharmacieSainteClaire';
import { pharmacieSaintFiacre } from './tenants/pharmacieSaintFiacre';
import { pharmacieSaintRoch } from './tenants/pharmacieSaintRoch';

/** Dans l'ordre du panneau : le premier est celui qu'on voit au premier lancement. */
export const allMockTenants: readonly MockTenant[] = [
  pharmacieDupont,
  pharmacieDesTilleuls,
  grandePharmacieDeLaPlace,
  pharmacieDuPort,
  pharmacieLumiere,
  pharmacieSaintRoch,
  pharmacieDeLaGare,
  pharmacieDuBeffroi,
  pharmacieDesQuais,
  pharmacieRiviere,
  pharmacieSaintFiacre,
  pharmacieDuVieuxMarche,
  pharmacieDesArcades,
  pharmacieSainteClaire,
];

export function findMockTenant(tenantId: string): MockTenant | undefined {
  return allMockTenants.find((mockTenant) => mockTenant.createTenantSite().tenantId === tenantId);
}
