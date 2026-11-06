import { demoPharmacyGroups } from '../demoPharmacyGroups';
import type { MockTenant } from '../MockTenant';
import { createSampleModuleData } from '../sampleModuleData';
import { weekWithLunchBreak } from '../weeklySchedules';

export const pharmacieRiviere: MockTenant = {
  description: 'Clair, données manquantes : ni logo ni photo ni email, groupement sans logo, ni équipe ni actualités, ni ordonnance (bouton d’en-tête remplacé par le téléphone).',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    return {
      tenantId: 'pharmacie-riviere',
      layoutId: 'clear',
      pharmacy: {
        name: 'Pharmacie Rivière',
        address: { street: '40 avenue de la Libération', postalCode: '33110', city: 'Le Bouscat' },
        phone: '05 56 08 12 90',
        group: demoPharmacyGroups[2]?.group,
      },
      fixedSections: { openingHours: { weeklySchedule: weekWithLunchBreak } },
      modules: {
        team: { enabled: false },
        services: { enabled: true, data: sampleModuleData.services },
        news: { enabled: false },
        prescriptionUpload: { enabled: false },
        loyaltyCard: { enabled: false },
        brands: { enabled: true, data: { brands: [{ name: 'Avène' }, { name: 'Weleda' }] } },
        appointment: { enabled: false },
        onlineOrder: { enabled: true, data: { url: 'https://commande.example/riviere' } },
        dutyHotline: { enabled: false },
      },
    };
  },
};
