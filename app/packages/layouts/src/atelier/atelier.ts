import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { atelierSettingsSchema, type AtelierSettings } from './atelierSettingsSchema';
import { LoyaltyCardPanel } from './organisms/LoyaltyCardPanel';
import { NewsColumns } from './organisms/NewsColumns';
import { OpeningHoursGrid } from './organisms/OpeningHoursGrid';
import { PrescriptionSteps } from './organisms/PrescriptionSteps';
import { ServiceIndex } from './organisms/ServiceIndex';
import { TeamGallery } from './organisms/TeamGallery';
import './atelier.css';

/** Le layout « atelier » : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const atelier: PharmacySiteLayout<AtelierSettings> = {
  settingsSchema: atelierSettingsSchema,
  openingHours: OpeningHoursGrid,
  team: TeamGallery,
  services: ServiceIndex,
  news: NewsColumns,
  prescriptionUpload: PrescriptionSteps,
  loyaltyCard: LoyaltyCardPanel,
};
