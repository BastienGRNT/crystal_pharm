import type { MockTenant } from '../MockTenant';
import { weekWithLunchBreak } from '../weeklySchedules';

export const pharmacieSaintRoch: MockTenant = {
  description: 'Aucun module placé : la page ne doit montrer que les sections fixes (accroche, garde, horaires, accès) et les mentions légales.',
  createTenantSite: () => ({
    tenantId: 'pharmacie-saint-roch',
    layoutId: 'essential',
    pharmacy: {
      name: 'Pharmacie Saint-Roch',
      address: { street: '27 rue Saint-Roch', postalCode: '75001', city: 'Paris' },
      phone: '01 42 60 00 00',
    },
    fixedSections: { openingHours: { weeklySchedule: weekWithLunchBreak } },
    modules: {
      team: { enabled: false },
      services: { enabled: false },
      news: { enabled: false },
      prescriptionUpload: { enabled: false },
      loyaltyCard: { enabled: false },
      brands: { enabled: false },
      appointment: { enabled: false },
      onlineOrder: { enabled: false },
    },
  }),
};
