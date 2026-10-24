import { isoTimestampInHoursFromNow } from '../isoTimestampInHoursFromNow';
import type { MockTenant } from '../MockTenant';
import { weekWithLunchBreak } from '../weeklySchedules';

export const pharmacieLumiere: MockTenant = {
  description: 'Sans groupement et sans aucune image : ni logo, ni photo, ni illustration. Actualités sans image, ordonnance sans texte d’accueil.',
  createTenantSite: () => ({
    tenantId: 'pharmacie-lumiere',
    layoutId: 'atelier',
    layoutSettings: { accentTone: 'saffron', editorialHeadline: 'La pharmacie qui éclaire vos choix.' },
    pharmacy: {
      name: 'Pharmacie Lumière',
      address: { street: '8 avenue Jean-Jaurès', postalCode: '13001', city: 'Marseille' },
      phone: '04 91 00 11 22',
      email: 'contact@pharmacie-lumiere.fr',
    },
    modules: {
      openingHours: {
        enabled: true,
        data: { weeklySchedule: weekWithLunchBreak, onDutyPeriods: [{ startsAt: isoTimestampInHoursFromNow(-1), endsAt: isoTimestampInHoursFromNow(14) }] },
      },
      team: {
        enabled: true,
        data: {
          members: [
            { fullName: 'Paul-Henri Lumière', role: 'Pharmacien titulaire' },
            { fullName: 'Aïcha Diallo', role: 'Pharmacienne adjointe' },
          ],
        },
      },
      services: { enabled: false },
      news: {
        enabled: true,
        data: {
          articles: [
            { title: 'Nouveau : les tests d’angine', summary: 'Un résultat en 10 minutes, sans rendez-vous.', publishedAt: '2026-10-01' },
            { title: 'Fermeture exceptionnelle', summary: 'La pharmacie sera fermée le 11 novembre.', publishedAt: '2026-10-18' },
          ],
        },
      },
      prescriptionUpload: { enabled: true, data: {} },
      loyaltyCard: { enabled: false },
    },
  }),
};
