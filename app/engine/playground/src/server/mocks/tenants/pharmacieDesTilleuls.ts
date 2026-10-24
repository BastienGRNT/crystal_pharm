import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { weekWithoutBreakOpenOnSunday } from '../weeklySchedules';

export const pharmacieDesTilleuls: MockTenant = {
  description: 'Sans groupement, donc sans carte de fidélité. Photos manquantes pour une partie de l’équipe (initiales), ouverte le dimanche.',
  createTenantSite: () => ({
    tenantId: 'pharmacie-des-tilleuls',
    layoutId: 'neighborhood',
    layoutSettings: { slogan: 'Sous les tilleuls, depuis 1987.' },
    pharmacy: {
      name: 'Pharmacie des Tilleuls',
      address: { street: '3 place des Tilleuls', postalCode: '44000', city: 'Nantes' },
      phone: '02 40 12 34 56',
      email: 'bonjour@pharmacie-tilleuls.fr',
      logoUrl: mockImageUrl('logo', 'Pharmacie des Tilleuls'),
    },
    modules: {
      openingHours: { enabled: true, data: { weeklySchedule: weekWithoutBreakOpenOnSunday } },
      team: {
        enabled: true,
        data: {
          members: [
            { fullName: 'Claire Martin', role: 'Pharmacienne titulaire', photoUrl: mockImageUrl('portrait', 'Claire Martin') },
            { fullName: 'Jean-Baptiste Leroy', role: 'Pharmacien adjoint' },
            { fullName: 'Inès Haddad', role: 'Préparatrice en pharmacie' },
          ],
        },
      },
      services: {
        enabled: true,
        data: {
          services: [
            { title: 'Orthopédie', description: 'Ceintures, attelles et bas de contention sur mesure.' },
            { title: 'Location de matériel', description: 'Fauteuils roulants, béquilles, tire-lait.' },
            { title: 'Vaccination', description: 'Sur rendez-vous ou sans, selon l’affluence.', iconName: 'syringe' },
          ],
        },
      },
      news: { enabled: false },
      prescriptionUpload: { enabled: true, data: {} },
      loyaltyCard: { enabled: false },
    },
  }),
};
