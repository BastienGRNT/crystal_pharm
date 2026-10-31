import type { PharmacySiteLayout } from '@crystal-pharm/renderer';
import { atelierSettingsSchema, type AtelierSettings } from './atelierManifest';
import { AppointmentPanel } from './organisms/AppointmentPanel';
import { BrandsList } from './organisms/BrandsList';
import { EditorialIntro } from './organisms/EditorialIntro';
import { FindUsPanel } from './organisms/FindUsPanel';
import { LoyaltyCardPanel } from './organisms/LoyaltyCardPanel';
import { NewsColumns } from './organisms/NewsColumns';
import { OnDutyNotice } from './organisms/OnDutyNotice';
import { OnlineOrderPanel } from './organisms/OnlineOrderPanel';
import { OpeningHoursGrid } from './organisms/OpeningHoursGrid';
import { PrescriptionSteps } from './organisms/PrescriptionSteps';
import { ServiceIndex } from './organisms/ServiceIndex';
import { TeamGallery } from './organisms/TeamGallery';
import './atelier.css';

/** Le layout « atelier » : son identifiant est le nom de ce dossier, ses pages sont les fichiers de pages/. */
export const atelier: PharmacySiteLayout<AtelierSettings> = {
  settingsSchema: atelierSettingsSchema,
  hero: EditorialIntro,
  findUs: FindUsPanel,
  onDuty: OnDutyNotice,
  openingHours: OpeningHoursGrid,
  brands: BrandsList,
  appointment: AppointmentPanel,
  onlineOrder: OnlineOrderPanel,
  team: TeamGallery,
  services: ServiceIndex,
  news: NewsColumns,
  prescriptionUpload: PrescriptionSteps,
  loyaltyCard: LoyaltyCardPanel,
};
