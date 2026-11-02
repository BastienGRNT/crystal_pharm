import type { MockTenant } from '../MockTenant';
import { createSampleModuleData } from '../sampleModuleData';
import { weekClosedOnMondayAndSaturdayAfternoon } from '../weeklySchedules';

export const pharmacieDuVieuxMarche: MockTenant = {
  description: 'Apothicaire, données manquantes : sans groupement, ni photo ni logo ni email, équipe sans photos, rendez-vous par lien externe, ni actualités ni marques.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    return {
      tenantId: 'pharmacie-du-vieux-marche',
      layoutId: 'apothecary',
      pharmacy: {
        name: 'Pharmacie du Vieux-Marché',
        address: { street: '5 place du Vieux-Marché', postalCode: '76000', city: 'Rouen' },
        phone: '02 35 71 20 48',
      },
      fixedSections: { openingHours: { weeklySchedule: weekClosedOnMondayAndSaturdayAfternoon } },
      modules: {
        team: {
          enabled: true,
          data: {
            members: [
              { fullName: 'Gilles Hamelin', role: 'Pharmacien titulaire' },
              { fullName: 'Sarah Vasseur', role: 'Pharmacienne adjointe' },
              { fullName: 'Lucas Morin', role: 'Préparateur en pharmacie' },
            ],
          },
        },
        services: { enabled: true, data: sampleModuleData.services },
        news: { enabled: false },
        prescriptionUpload: { enabled: true, data: {} },
        loyaltyCard: { enabled: false },
        brands: { enabled: false },
        appointment: { enabled: true, data: { mode: 'externalLink', url: 'https://rendez-vous.example/vieux-marche' } },
        onlineOrder: { enabled: false },
        dutyHotline: { enabled: true, data: {} },
      },
    };
  },
};
