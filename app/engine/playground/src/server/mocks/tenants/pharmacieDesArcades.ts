import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleFixedSectionsData, createSampleModuleData } from '../sampleModuleData';

export const pharmacieDesArcades: MockTenant = {
  description: 'Vitrine, complète : grande photo de l’officine en tête, groupement, tous les modules, actualités illustrées.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    const sampleFixedSectionsData = createSampleFixedSectionsData();
    return {
      tenantId: 'pharmacie-des-arcades',
      layoutId: 'showcase',
      pharmacy: {
        name: 'Pharmacie des Arcades',
        address: { street: '24 place des Arcades', postalCode: '06000', city: 'Nice' },
        phone: '04 93 62 30 11',
        email: 'conseil@pharmacie-des-arcades.fr',
        logoUrl: mockImageUrl('logo', 'Pharmacie des Arcades'),
        group: demoPharmacyGroups[1]?.group,
      },
      fixedSections: {
        hero: { imageUrl: mockImageUrl('hero', 'Pharmacie des Arcades'), headline: 'La beauté de la peau commence par un bon conseil.' },
        findUs: sampleFixedSectionsData.findUs,
        openingHours: { weeklySchedule: sampleFixedSectionsData.openingHours.weeklySchedule },
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
        dutyHotline: { enabled: true, data: sampleModuleData.dutyHotline },
      },
    };
  },
};
