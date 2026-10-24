import { demoPharmacyGroups } from '../demoPharmacyGroups';
import { isoTimestampInHoursFromNow } from '../isoTimestampInHoursFromNow';
import { mockImageUrl } from '../mockImageUrl';
import type { MockTenant } from '../MockTenant';
import { createSampleModuleData } from '../sampleModuleData';
import { weekWithoutBreakOpenOnSunday } from '../weeklySchedules';

const teamMembers = [
  ['Sophie Lambert', 'Pharmacienne titulaire'],
  ['Marc Lambert', 'Pharmacien titulaire'],
  ['Nadia Belkacem', 'Pharmacienne adjointe'],
  ['Hugo Petit', 'Pharmacien adjoint'],
  ['Camille Roux', 'Préparatrice en pharmacie'],
  ['Antoine Fabre', 'Préparateur en pharmacie'],
  ['Julie Mercier', 'Préparatrice en pharmacie'],
  ['Yanis Chevalier', 'Apprenti préparateur'],
  ['Emma Girard', 'Conseillère en dermocosmétique'],
  ['Louis Bonnet', 'Orthopédiste'],
  ['Chloé Dumas', 'Responsable parapharmacie'],
  ['Mathis Fontaine', 'Étudiant en pharmacie'],
];

export const grandePharmacieDeLaPlace: MockTenant = {
  description: 'Beaucoup de tout : 12 personnes, 10 services, 6 actualités, un groupement qui impose deux modules, deux gardes cette semaine.',
  createTenantSite: () => {
    const sampleModuleData = createSampleModuleData();
    return {
      tenantId: 'grande-pharmacie-de-la-place',
      layoutId: 'neighborhood',
      apiBaseUrl: '/api',
      layoutSettings: { heroImageUrl: mockImageUrl('hero', 'Grande Pharmacie de la Place'), showOnDutyBanner: true },
      pharmacy: {
        name: 'Grande Pharmacie de la Place',
        address: { street: '45 place du Général-de-Gaulle', postalCode: '59000', city: 'Lille' },
        phone: '03 20 55 66 77',
        email: 'accueil@grande-pharmacie-place.fr',
        logoUrl: mockImageUrl('logo', 'Grande Pharmacie de la Place'),
        group: demoPharmacyGroups[1]?.group,
      },
      modules: {
        openingHours: {
          enabled: true,
          data: {
            weeklySchedule: weekWithoutBreakOpenOnSunday,
            onDutyPeriods: [
              { startsAt: isoTimestampInHoursFromNow(30), endsAt: isoTimestampInHoursFromNow(42) },
              { startsAt: isoTimestampInHoursFromNow(-60), endsAt: isoTimestampInHoursFromNow(-48) },
            ],
          },
        },
        team: {
          enabled: true,
          data: {
            members: teamMembers.map(([fullName = '', role = ''], index) =>
              index % 4 === 3 ? { fullName, role } : { fullName, role, photoUrl: mockImageUrl('portrait', fullName) },
            ),
          },
        },
        services: {
          enabled: true,
          data: {
            services: [
              ...sampleModuleData.services.services,
              { title: 'Orthopédie', description: 'Ceintures, attelles et bas de contention sur mesure.' },
              { title: 'Location de matériel', description: 'Fauteuils roulants, béquilles, tire-lait.' },
              { title: 'Dermocosmétique', description: 'Un diagnostic de peau offert et des conseils personnalisés.', iconName: 'leaf' },
              { title: 'Aromathérapie', description: 'Huiles essentielles : usages, précautions et contre-indications.', iconName: 'leaf' },
              { title: 'Sevrage tabagique', description: 'Substituts nicotiniques et suivi, pris en charge sur prescription.', iconName: 'pill' },
            ],
          },
        },
        news: {
          enabled: true,
          data: {
            articles: [
              ...sampleModuleData.news.articles,
              { title: 'Nos horaires pendant les fêtes', summary: 'Ouverts les 24 et 31 décembre jusqu’à 17 h.', publishedAt: '2026-10-20' },
              {
                title: 'Allergies : la saison des pollens commence tôt cette année',
                summary: 'Antihistaminiques, sprays, collyres : nos conseils pour passer le printemps sereinement.',
                publishedAt: '2026-03-02',
                imageUrl: mockImageUrl('news', 'Pollens'),
              },
              { title: 'Arrivée de Mathis dans l’équipe', summary: 'Étudiant en 5e année, il nous rejoint pour son stage de fin d’études.', publishedAt: '2026-06-15' },
            ],
          },
        },
        prescriptionUpload: { enabled: true, data: sampleModuleData.prescriptionUpload },
        loyaltyCard: {
          enabled: true,
          data: {
            text: 'Votre carte Alliance : 5 % de remise immédiate sur toute la parapharmacie, dans les 340 pharmacies du réseau.',
            url: 'https://alliance-sante-proximite.example/carte',
            imageUrl: mockImageUrl('loyaltyCard', 'Alliance'),
          },
        },
      },
    };
  },
};
