import type { MockTenant } from '../MockTenant';
import { createSampleModuleData } from '../sampleModuleData';
import { weekWithLunchBreak } from '../weeklySchedules';

export const pharmacieSainteClaire: MockTenant = {
  description: 'Vitrine, données manquantes : aucune image (aplat teinté et grande croix à la place de la photo), sans groupement, équipe sans photos, actualités sans image.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    return {
      tenantId: 'pharmacie-sainte-claire',
      layoutId: 'showcase',
      pharmacy: {
        name: 'Pharmacie Sainte-Claire',
        address: { street: '2 cours Mirabeau', postalCode: '13100', city: 'Aix-en-Provence' },
        phone: '04 42 26 14 70',
      },
      fixedSections: { openingHours: { weeklySchedule: weekWithLunchBreak } },
      modules: {
        team: {
          enabled: true,
          data: {
            members: [
              { fullName: 'Mathilde Roche', role: 'Pharmacienne titulaire' },
              { fullName: 'Ilyes Benamar', role: 'Pharmacien adjoint' },
              { fullName: 'Coralie Faure', role: 'Conseillère en dermocosmétique' },
            ],
          },
        },
        services: { enabled: true, data: sampleModuleData.services },
        news: {
          enabled: true,
          data: {
            articles: [
              { title: 'Nouveau : les tests d’angine', summary: 'Un résultat en 10 minutes, sans rendez-vous.', publishedAt: '2026-10-01' },
              { title: 'Fermeture exceptionnelle', summary: 'La pharmacie sera fermée le 11 novembre.', publishedAt: '2026-10-18' },
            ],
          },
        },
        prescriptionUpload: { enabled: true, data: sampleModuleData.prescriptionUpload },
        loyaltyCard: { enabled: false },
        brands: { enabled: true, data: { brands: [{ name: 'La Roche-Posay' }, { name: 'Avène' }, { name: 'Caudalie' }] } },
        appointment: { enabled: true, data: sampleModuleData.appointment },
        onlineOrder: { enabled: false },
        dutyHotline: { enabled: false },
      },
    };
  },
};
