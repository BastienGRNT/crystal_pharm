import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { essentialSettingsSchema, type EssentialSettings } from './essentialManifest';
import { LoyaltyCardBlock } from './organisms/LoyaltyCardBlock';
import { NewsBlock } from './organisms/NewsBlock';
import { OpeningHoursBlock } from './organisms/OpeningHoursBlock';
import { PrescriptionCollapsibleCard } from './organisms/PrescriptionCollapsibleCard';
import { ServicesBlock } from './organisms/ServicesBlock';
import { TeamBlock } from './organisms/TeamBlock';
import './essential.css';

/** Le layout « essential » : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const essential: PharmacySiteLayout<EssentialSettings> = {
  settingsSchema: essentialSettingsSchema,
  openingHours: OpeningHoursBlock,
  team: TeamBlock,
  services: ServicesBlock,
  news: NewsBlock,
  prescriptionUpload: PrescriptionCollapsibleCard,
  loyaltyCard: LoyaltyCardBlock,
};
