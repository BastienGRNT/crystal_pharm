import type { PlaygroundCatalog } from '../../shared/PlaygroundCatalog';
import { allMockTenants } from '../mocks/allMockTenants';
import { demoPharmacyGroups } from '../mocks/demoPharmacyGroups';
import { discoverLayouts } from './discoverLayouts';

export function buildPlaygroundCatalog(layoutsSourceDirectory: string): PlaygroundCatalog {
  return {
    mockTenants: allMockTenants.map((mockTenant) => {
      const tenantSite = mockTenant.createTenantSite();
      return {
        tenantId: tenantSite.tenantId,
        pharmacyName: tenantSite.pharmacy.name,
        description: mockTenant.description,
        layoutId: tenantSite.layoutId,
        groupName: tenantSite.pharmacy.group?.name,
      };
    }),
    pharmacyGroups: demoPharmacyGroups.map(({ groupId, description, group }) => ({ groupId, name: group.name, description })),
    layouts: discoverLayouts(layoutsSourceDirectory),
  };
}
