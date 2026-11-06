import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleFixedSectionsData, createSampleModuleData } from '../sampleModuleData';

export const pharmacieSaintFiacre: MockTenant = {
  description: 'Apothicaire, complète : groupement au nom très long, tous les modules, photo encadrée sous l’étiquette, cinq services en tiroirs.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    const sampleFixedSectionsData = createSampleFixedSectionsData();
    return {
      tenantId: 'pharmacie-saint-fiacre',
      layoutId: 'apothecary',
      pharmacy: {
        name: 'Pharmacie Saint-Fiacre',
        address: { street: '11 rue Saint-Fiacre', postalCode: '75002', city: 'Paris' },
        phone: '01 42 33 10 52',
        email: 'officine@pharmacie-saint-fiacre.fr',
        group: demoPharmacyGroups[3]?.group,
      },
      fixedSections: {
        hero: { imageUrl: mockImageUrl('hero', 'Pharmacie Saint-Fiacre'), headline: 'Préparations magistrales depuis 1898.' },
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
