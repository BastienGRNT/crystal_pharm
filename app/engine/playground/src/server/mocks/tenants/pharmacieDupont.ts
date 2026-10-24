import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleModuleData } from '../sampleModuleData';

export const pharmacieDupont: MockTenant = {
  description: 'Complète : groupement avec logo qui impose la carte de fidélité, tous les modules, photos partout, de garde en ce moment.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    return {
      tenantId: 'pharmacie-dupont',
      layoutId: 'essential',
      pharmacy: {
        name: 'Pharmacie Dupont',
        address: { street: '12 rue de la République', postalCode: '69002', city: 'Lyon' },
        phone: '04 78 42 15 30',
        email: 'contact@pharmacie-dupont.fr',
        logoUrl: mockImageUrl('logo', 'Pharmacie Dupont'),
        group: demoPharmacyGroups[0]?.group,
      },
      modules: {
        openingHours: { enabled: true, data: sampleModuleData.openingHours },
        team: { enabled: true, data: sampleModuleData.team },
        services: { enabled: true, data: sampleModuleData.services },
        news: { enabled: true, data: sampleModuleData.news },
        prescriptionUpload: { enabled: true, data: sampleModuleData.prescriptionUpload },
        loyaltyCard: { enabled: true, data: sampleModuleData.loyaltyCard },
      },
    };
  },
};
