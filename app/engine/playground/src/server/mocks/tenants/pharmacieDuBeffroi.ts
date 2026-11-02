import type { MockTenant } from '../MockTenant';
import { weekClosedOnMondayAndSaturdayAfternoon } from '../weeklySchedules';

export const pharmacieDuBeffroi: MockTenant = {
  description: 'Enseigne, données manquantes : nom très long, ni logo ni photo ni email, équipe sans photos, rendez-vous par lien externe, fermée le lundi (croix éteinte).',
  createTenantSite: () => ({
    tenantId: 'pharmacie-du-beffroi',
    layoutId: 'signboard',
    pharmacy: {
      name: 'Pharmacie du Beffroi et de la Grand-Place',
      address: { street: '3 rue du Beffroi', postalCode: '59800', city: 'Lille' },
      phone: '03 20 31 44 55',
    },
    fixedSections: { openingHours: { weeklySchedule: weekClosedOnMondayAndSaturdayAfternoon } },
    modules: {
      team: {
        enabled: true,
        data: {
          members: [
            { fullName: 'Bruno Delattre', role: 'Pharmacien titulaire' },
            { fullName: 'Amandine Lefebvre', role: 'Préparatrice en pharmacie' },
          ],
        },
      },
      services: { enabled: false },
      news: { enabled: false },
      prescriptionUpload: { enabled: true, data: {} },
      loyaltyCard: { enabled: false },
      brands: { enabled: false },
      appointment: { enabled: true, data: { mode: 'externalLink', url: 'https://rendez-vous.example/beffroi' } },
      onlineOrder: { enabled: false },
      dutyHotline: { enabled: true, data: {} },
    },
  }),
};
