import type { MockTenant } from '../MockTenant';

export const pharmacieSaintRoch: MockTenant = {
  description: 'Aucun module activé : la page ne doit montrer que la fiche et les mentions légales, sans section vide.',
  createTenantSite: () => ({
    tenantId: 'pharmacie-saint-roch',
    layoutId: 'essential',
    pharmacy: {
      name: 'Pharmacie Saint-Roch',
      address: { street: '27 rue Saint-Roch', postalCode: '75001', city: 'Paris' },
      phone: '01 42 60 00 00',
    },
    modules: {
      openingHours: { enabled: false },
      team: { enabled: false },
      services: { enabled: false },
      news: { enabled: false },
      prescriptionUpload: { enabled: false },
      loyaltyCard: { enabled: false },
    },
  }),
};
