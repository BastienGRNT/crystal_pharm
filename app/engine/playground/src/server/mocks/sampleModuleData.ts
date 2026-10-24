import type { ModuleName } from '@crystal-pharm/schema';
import { isoTimestampInHoursFromNow } from './isoTimestampInHoursFromNow';
import { mockImageUrl } from './mockImageUrl';
import type { EnabledModuleData } from './MockTenant';
import { weekWithLunchBreak } from './weeklySchedules';

/** Des données complètes pour chaque module : celles d'un module activé depuis le panneau quand son mock n'en a pas. */
export function createSampleModuleData(): { [Name in ModuleName]: EnabledModuleData<Name> } {
  return {
    openingHours: {
      weeklySchedule: weekWithLunchBreak,
      onDutyPeriods: [{ startsAt: isoTimestampInHoursFromNow(-2), endsAt: isoTimestampInHoursFromNow(10) }],
    },
    team: {
      members: [
        { fullName: 'Hélène Dupont', role: 'Pharmacienne titulaire', photoUrl: mockImageUrl('portrait', 'Hélène Dupont') },
        { fullName: 'Thomas Morel', role: 'Pharmacien adjoint', photoUrl: mockImageUrl('portrait', 'Thomas Morel') },
        { fullName: 'Léa Garnier', role: 'Préparatrice en pharmacie', photoUrl: mockImageUrl('portrait', 'Léa Garnier') },
        { fullName: 'Karim Benali', role: 'Préparateur en pharmacie', photoUrl: mockImageUrl('portrait', 'Karim Benali') },
      ],
    },
    services: {
      services: [
        { title: 'Vaccination', description: 'Grippe, Covid-19, rappels DTP : sans rendez-vous du lundi au vendredi.', iconName: 'syringe' },
        { title: 'Tests rapides', description: 'Angine, cystite, Covid-19 : résultat en quelques minutes.', iconName: 'test-tube' },
        { title: 'Tension artérielle', description: 'Mesure gratuite et conseils de suivi.', iconName: 'heart-pulse' },
        { title: 'Bilan de médication', description: 'Un entretien pour faire le point sur vos traitements.', iconName: 'pill' },
        { title: 'Phytothérapie', description: 'Conseils en plantes et huiles essentielles.', iconName: 'leaf' },
      ],
    },
    news: {
      articles: [
        {
          title: 'La campagne de vaccination contre la grippe est ouverte',
          summary: 'Venez vous faire vacciner sans rendez-vous. Pensez à apporter votre carte Vitale.',
          publishedAt: '2026-10-14',
          imageUrl: mockImageUrl('news', 'Vaccination'),
        },
        {
          title: 'Rentrée : faites le point sur les vitamines',
          summary: 'Fatigue passagère ? Nos conseils pour bien choisir un complément alimentaire.',
          publishedAt: '2026-09-20',
          imageUrl: mockImageUrl('news', 'Vitamines'),
        },
        {
          title: 'Nouveau : le bilan de médication',
          summary: 'Vous prenez plus de cinq médicaments par jour ? Un entretien avec votre pharmacien, pris en charge par l’Assurance maladie.',
          publishedAt: '2026-09-02',
          imageUrl: mockImageUrl('news', 'Bilan'),
        },
      ],
    },
    prescriptionUpload: {
      introduction: 'Envoyez-nous votre ordonnance : nous préparons votre commande et vous appelons dès qu’elle est prête.',
    },
    loyaltyCard: {
      text: '1 € dépensé = 1 point. Dès 100 points, 5 € offerts sur la parapharmacie.',
      url: 'https://fidelite.example/inscription',
      imageUrl: mockImageUrl('loyaltyCard', 'Carte fidélité'),
    },
  };
}
