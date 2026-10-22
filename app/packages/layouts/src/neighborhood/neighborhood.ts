import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { neighborhoodSettingsSchema, type NeighborhoodSettings } from './neighborhoodSettingsSchema';
import { LoyaltyCardSection } from './organisms/LoyaltyCardSection';
import { NewsSection } from './organisms/NewsSection';
import { OpeningHoursSection } from './organisms/OpeningHoursSection';
import { PrescriptionSection } from './organisms/PrescriptionSection';
import { ServicesSection } from './organisms/ServicesSection';
import { TeamSection } from './organisms/TeamSection';
import './neighborhood.css';

/** Le layout « neighborhood » : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const neighborhood: PharmacySiteLayout<NeighborhoodSettings> = {
  settingsSchema: neighborhoodSettingsSchema,
  openingHours: OpeningHoursSection,
  team: TeamSection,
  services: ServicesSection,
  news: NewsSection,
  prescriptionUpload: PrescriptionSection,
  loyaltyCard: LoyaltyCardSection,
};
