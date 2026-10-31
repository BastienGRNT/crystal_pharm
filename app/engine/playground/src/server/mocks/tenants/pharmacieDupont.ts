import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleFixedSectionsData, createSampleModuleData } from '../sampleModuleData';

export const pharmacieDupont: MockTenant = {
  description: 'Complète : groupement avec logo qui impose la carte de fidélité, tous les modules et sections, photos partout, de garde en ce moment.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    const sampleFixedSectionsData = createSampleFixedSectionsData();
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
      fixedSections: {
        hero: { imageUrl: mockImageUrl('hero', 'Pharmacie Dupont') },
        findUs: sampleFixedSectionsData.findUs,
        openingHours: sampleFixedSectionsData.openingHours,
      },
      modules: {
        team: { enabled: true, data: sampleModuleData.team },
        services: { enabled: true, data: sampleModuleData.services },
        news: { enabled: true, data: sampleModuleData.news },
        prescriptionUpload: { enabled: true, data: sampleModuleData.prescriptionUpload },
        loyaltyCard: { enabled: true, data: sampleModuleData.loyaltyCard },
        brands: { enabled: true, data: sampleModuleData.brands },
        appointment: { enabled: true, data: sampleModuleData.appointment },
        onlineOrder: { enabled: true, data: sampleModuleData.onlineOrder },
      },
    };
  },
};
