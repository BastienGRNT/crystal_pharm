import { mockImageUrl } from './mockImageUrl';
import type { PharmacyGroupInput } from './MockTenant';

export type DemoPharmacyGroup = { groupId: string; description: string; group: PharmacyGroupInput };

/** Les groupements qu'on peut donner à n'importe quelle pharmacie depuis le panneau. */
export const demoPharmacyGroups: readonly DemoPharmacyGroup[] = [
  {
    groupId: 'reseau-officinal',
    description: 'Avec logo, impose la carte de fidélité.',
    group: { name: 'Réseau Officinal', logoUrl: mockImageUrl('groupLogo', 'Réseau Officinal'), mandatoryModules: ['loyaltyCard'] },
  },
  {
    groupId: 'alliance-sante-proximite',
    description: "Avec logo, impose la carte de fidélité et l'envoi d'ordonnance.",
    group: {
      name: 'Alliance Santé Proximité',
      logoUrl: mockImageUrl('groupLogo', 'Alliance Santé Proximité'),
      mandatoryModules: ['loyaltyCard', 'prescriptionUpload'],
    },
  },
  {
    groupId: 'groupement-sans-logo',
    description: "Sans logo, n'impose rien.",
    group: { name: 'Pharmaciens Associés du Val' },
  },
  {
    groupId: 'groupement-au-nom-tres-long',
    description: 'Nom très long, logo large : pour les bandeaux.',
    group: {
      name: 'Union Nationale des Pharmaciens Indépendants de Proximité et de Conseil',
      logoUrl: mockImageUrl('groupLogo', 'UNPIPC'),
    },
  },
];
