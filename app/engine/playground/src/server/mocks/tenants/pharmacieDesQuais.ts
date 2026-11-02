import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleFixedSectionsData, createSampleModuleData } from '../sampleModuleData';

export const pharmacieDesQuais: MockTenant = {
  description: 'Clair, complète : groupement qui impose la carte de fidélité, tous les modules, photo de l’officine en bande, horaires avec pause de midi.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    const sampleFixedSectionsData = createSampleFixedSectionsData();
    return {
      tenantId: 'pharmacie-des-quais',
      layoutId: 'clear',
      pharmacy: {
        name: 'Pharmacie des Quais',
        address: { street: '9 quai de la Fosse', postalCode: '44000', city: 'Nantes' },
        phone: '02 40 47 18 20',
        email: 'bonjour@pharmacie-des-quais.fr',
        group: demoPharmacyGroups[0]?.group,
      },
      fixedSections: {
        hero: { imageUrl: mockImageUrl('hero', 'Pharmacie des Quais'), headline: 'Au bord de la Loire, depuis 1962.' },
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
